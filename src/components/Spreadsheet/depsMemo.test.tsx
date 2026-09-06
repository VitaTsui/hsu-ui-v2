import { render } from "@testing-library/react";
import React, { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 2.5.7：`xOptions` 的解构默认值与 `xOptionsRest` 这个 rest 包每渲染都是新对象，
 * 直接进「建表格实例」那条 effect 的依赖数组 → **effect 每渲染必重跑**。
 * 实例本身被 `!sheet` 挡住了不会重建，但 effect 体每次都白跑一遍，
 * 且依赖里挂着的 `xOptionsRest` 永远比不出「配置真的变了」——纯粹的假依赖。
 *
 * 这里单独一个文件，是因为要把 `x-data-spreadsheet` 换成假实现（jsdom 里跑不了真的）。
 */

const probe = { effect: 0 };
(globalThis as Record<string, unknown>).__spreadsheetProbe = probe;

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const counters = () =>
    (globalThis as Record<string, unknown>).__spreadsheetProbe as typeof probe;
  return {
    ...actual,
    useEffect: (fn: () => unknown, deps: unknown[]) =>
      actual.useEffect(() => {
        counters().effect++;
        return fn() as ReturnType<React.EffectCallback>;
      }, deps),
  };
});

const construct = vi.fn();
const loadData = vi.fn();

vi.mock("x-data-spreadsheet", () => ({
  default: class FakeSpreadsheet {
    constructor(...args: unknown[]) {
      construct(...args);
    }
    loadData(...args: unknown[]) {
      loadData(...args);
      return this;
    }
  },
}));
vi.mock("x-data-spreadsheet/dist/xspreadsheet.css", () => ({}));

import Spreadsheet from ".";

beforeEach(() => {
  probe.effect = 0;
  construct.mockClear();
  loadData.mockClear();
});

function rerenderEffectCost(make: () => ReactElement) {
  const { rerender, unmount } = render(make());
  const before = probe.effect;
  rerender(make());
  const cost = probe.effect - before;
  unmount();
  return cost;
}

describe("Spreadsheet：xOptions / xOptionsRest 不再让建表 effect 每渲染必重跑", () => {
  it("配置没变时重渲染不再重跑任何 effect", () => {
    // 不传 xOptions（走默认值）与传内联对象（消费方最常见的写法）都必须为 0
    expect(rerenderEffectCost(() => <Spreadsheet />)).toBe(0);
    expect(
      rerenderEffectCost(() => <Spreadsheet xOptions={{ showBottomTool: true }} />),
    ).toBe(0);
  });

  it("表格实例只建一次，重渲染不会重复 new", () => {
    const { rerender } = render(<Spreadsheet />);
    rerender(<Spreadsheet />);
    rerender(<Spreadsheet />);
    expect(construct).toHaveBeenCalledTimes(1);
  });

  it("xOptions 真变了仍然透进新配置（浅比较不相等就立刻透出）", () => {
    // 首帧就带上配置，确认它确实进了 XSpreadsheet 的构造参数
    render(<Spreadsheet xOptions={{ showBottomTool: false, mode: "read" }} />);
    expect(construct).toHaveBeenCalledTimes(1);
    expect(construct.mock.calls[0][1]).toMatchObject({ mode: "read" });
  });

  it("data 真变了仍然重新 loadData", () => {
    const bookA = { SheetNames: ["A"], Sheets: { A: {} } } as never;
    const bookB = { SheetNames: ["B"], Sheets: { B: {} } } as never;
    const { rerender } = render(<Spreadsheet data={bookA} />);
    const first = loadData.mock.calls.length;
    rerender(<Spreadsheet data={bookB} />);
    expect(loadData.mock.calls.length).toBeGreaterThan(first);
  });
});
