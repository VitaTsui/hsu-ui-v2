import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useSelectComposition } from "./useSelectComposition";

/**
 * 这里的 onSearch 只被当作「要不要监听输入法事件」的真值判断，effect 体从不调它。
 * 它直接进依赖数组，消费方传内联箭头就会每渲染一次拆装一次 window 监听。
 */
describe("useSelectComposition", () => {
  let addSpy: ReturnType<typeof vi.spyOn>;

  const countAdds = () =>
    addSpy.mock.calls.filter(([type]) => type === "compositionstart").length;

  beforeEach(() => {
    addSpy = vi.spyOn(window, "addEventListener");
  });
  afterEach(() => {
    addSpy.mockRestore();
  });

  it("没传 onSearch 不注册；从无到有传入时会注册", () => {
    const { rerender } = renderHook(
      ({ onSearch }: { onSearch?: (v: string) => void }) =>
        useSelectComposition({ onSearch }),
      { initialProps: {} as { onSearch?: (v: string) => void } },
    );
    expect(countAdds()).toBe(0);

    rerender({ onSearch: () => {} });
    expect(countAdds()).toBe(1);
  });

  it("onSearch 换引用不会反复拆装 window 监听", () => {
    const { rerender } = renderHook(
      ({ onSearch }: { onSearch?: (v: string) => void }) =>
        useSelectComposition({ onSearch }),
      { initialProps: { onSearch: () => {} } },
    );
    expect(countAdds()).toBe(1);

    rerender({ onSearch: () => {} });
    rerender({ onSearch: () => {} });
    expect(countAdds()).toBe(1);
  });
});
