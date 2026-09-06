import React, { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";

import useAutoScrolling from "./useAutoScrolling";

/**
 * onAutoScrollEndAdd 在这个 hook 里身兼两职：既是「有没有加载更多」的开关，
 * 又是真正去加载的动作。整条 rAF 循环挂在它的引用上（loop 依赖它、启停 effect 依赖 loop），
 * 消费方传内联箭头就会每渲染一次重启一次滚动循环 —— 表格滚到一半被打回起点。
 */

const DATA = [{ key: "1" }, { key: "2" }];

function Host({
  onAutoScrollEndAdd,
}: {
  onAutoScrollEndAdd?: () => Promise<boolean>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useAutoScrolling({
    autoScrolling: true,
    ref,
    dataSource: DATA,
    onAutoScrollEndAdd,
  });

  return (
    <div ref={ref}>
      <div className="ant-table-body">
        <table>
          <tbody className="ant-table-tbody" />
        </table>
      </div>
    </div>
  );
}

describe("useAutoScrolling", () => {
  let cancelSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 让 rAF 不真的跑，cancelAnimationFrame 就只会由 effect 的 cleanup 触发，
    // 于是「循环有没有被重启」可以直接数出来
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      () => 1 as unknown as number,
    );
    cancelSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** hook 靠 MutationObserver 把自己标成 ready，这里手动改一次 DOM 触发它 */
  const makeReady = async (container: HTMLElement) => {
    await act(async () => {
      container
        .querySelector(".ant-table-tbody")!
        .appendChild(document.createElement("tr"));
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(window.requestAnimationFrame).toHaveBeenCalled(),
    );
  };

  it("onAutoScrollEndAdd 换引用不会重启滚动循环", async () => {
    const { container, rerender } = render(
      <Host onAutoScrollEndAdd={() => Promise.resolve(true)} />,
    );
    await makeReady(container);

    const before = cancelSpy.mock.calls.length;

    rerender(<Host onAutoScrollEndAdd={() => Promise.resolve(true)} />);
    rerender(<Host onAutoScrollEndAdd={() => Promise.resolve(true)} />);

    expect(cancelSpy.mock.calls.length).toBe(before);
  });

  it("从无到有传入 onAutoScrollEndAdd 时会接上加载更多（循环按新开关重建一次）", async () => {
    const { container, rerender } = render(<Host />);
    await makeReady(container);

    const before = cancelSpy.mock.calls.length;

    rerender(<Host onAutoScrollEndAdd={() => Promise.resolve(true)} />);

    // 开关从 false 变 true，循环必须按新语义重建，否则「加载更多」永远接不上
    expect(cancelSpy.mock.calls.length).toBeGreaterThan(before);
  });
});
