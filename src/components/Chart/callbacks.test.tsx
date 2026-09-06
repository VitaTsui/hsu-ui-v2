import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

/**
 * 这一组用例盯的是同一条缺陷：**回调 prop 进 effect 依赖数组**。
 *
 * 消费方写内联箭头（`onXxx={(v) => setV(v)}`）时每次渲染都是新引用，
 * 回调进依赖数组 → effect 重跑 → 重新 setOption / 重新注册监听 / 再发一次通知，
 * 通知里再 setState 就是死循环。
 *
 * 但这些回调同时还被当作「要不要注册这个监听」的真值判断，
 * 所以修法不能是「把回调从依赖数组里删掉」了事——
 * 「从无到有传入回调」必须仍然能正确注册，这里每个组件都单独验一条。
 */

type Handler = (params: unknown) => void;

const chart = {
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  getDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
  getOption: vi.fn(() => ({ dataZoom: [{ start: 0, end: 100 }] })),
  on: vi.fn(),
  off: vi.fn(),
};
const handlers = new Map<string, Set<Handler>>();

chart.on.mockImplementation(((event: string, handler: Handler) => {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(handler);
}) as never);
chart.off.mockImplementation(((event: string, handler?: Handler) => {
  if (!handler) handlers.delete(event);
  else handlers.get(event)?.delete(handler);
}) as never);

const emit = (event: string, params?: unknown) => {
  act(() => {
    handlers.get(event)?.forEach((h) => h(params));
  });
};
const listenerCount = (event: string) => handlers.get(event)?.size ?? 0;

vi.mock("echarts", () => ({
  init: () => chart,
  use: () => {},
  registerTheme: () => {},
  graphic: {},
}));
vi.mock("echarts-gl", () => ({}));

import ChartBar from "./Bar";
import ChartLine from "./Line";
import ChartSankey from "./Sankey";
import ChartTree from "./Tree";
import ChartPie from "./Pie";

// 容器必须量得到尺寸，否则 useContainerReady 不放行 echarts.init
beforeEach(() => {
  handlers.clear();
  vi.clearAllMocks();
  chart.getOption.mockImplementation(() => ({
    dataZoom: [{ start: 0, end: 100 }],
  }));
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: 600,
    height: 400,
    top: 0,
    left: 0,
    right: 600,
    bottom: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
});

const X_AXIS = ["一", "二", "三", "四"];
const SERIES = [{ name: "A", value: [1, 2, 3, 4] }];
const SANKEY_NODES = [{ name: "a" }, { name: "b" }];
const SANKEY_LINKS = [{ source: "a", target: "b" }];
const TREE_DATA = [{ name: "root", value: 1, children: [] }];
const PIE_DATA = [{ name: "a", value: 1 }];

describe("Chart.Bar / Chart.Line 的回调 prop", () => {
  const cases = [
    ["Chart.Bar", ChartBar],
    ["Chart.Line", ChartLine],
  ] as const;

  for (const [name, Comp] of cases) {
    describe(name, () => {
      it("内联 onDataZoomWindowChanged 写回 state 不会死循环，窗口没变也不重复通知", () => {
        const spy = vi.fn();

        function Consumer() {
          const [, setWin] = useState<unknown>(null);

          return (
            <Comp
              xAxisData={X_AXIS}
              seriesData={SERIES}
              // 内联箭头：每次渲染都是新引用
              onDataZoomWindowChanged={(w) => {
                spy(w);
                setWin(w);
              }}
            />
          );
        }

        render(<Consumer />);

        // 初次同步一次窗口；进了循环这里会是几十上百次
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ startIndex: 0, endIndex: 3 });
      });

      it("onClick 换引用不重复注册监听，且调到的是最新的那个", () => {
        const first = vi.fn();
        const second = vi.fn();

        const { rerender } = render(
          <Comp xAxisData={X_AXIS} seriesData={SERIES} onClick={first} />,
        );
        expect(listenerCount("click")).toBe(1);

        rerender(
          <Comp xAxisData={X_AXIS} seriesData={SERIES} onClick={second} />,
        );
        // 换引用不该拆装监听，更不该重新 setOption
        expect(listenerCount("click")).toBe(1);

        emit("click", { name: "x" });
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
      });

      it("onLegendSelectChanged 从无到有传入时仍会注册", () => {
        const { rerender } = render(
          <Comp xAxisData={X_AXIS} seriesData={SERIES} />,
        );
        // 没传就不注册
        expect(listenerCount("legendselectchanged")).toBe(0);

        const spy = vi.fn();
        rerender(
          <Comp
            xAxisData={X_AXIS}
            seriesData={SERIES}
            onLegendSelectChanged={spy}
          />,
        );
        expect(listenerCount("legendselectchanged")).toBe(1);

        emit("legendselectchanged", { selected: { A: false } });
        expect(spy).toHaveBeenCalledWith({ A: false });
      });

      it("onDataZoomWindowChanged 从无到有传入时仍会注册并同步一次窗口", () => {
        const { rerender } = render(
          <Comp xAxisData={X_AXIS} seriesData={SERIES} />,
        );
        expect(listenerCount("datazoom")).toBe(0);

        const spy = vi.fn();
        rerender(
          <Comp
            xAxisData={X_AXIS}
            seriesData={SERIES}
            onDataZoomWindowChanged={spy}
          />,
        );
        expect(listenerCount("datazoom")).toBe(1);
        expect(spy).toHaveBeenCalledWith({ startIndex: 0, endIndex: 3 });

        spy.mockClear();
        emit("datazoom", { start: 25, end: 100 });
        expect(spy).toHaveBeenCalledWith({ startIndex: 1, endIndex: 3 });
      });

      it("传回调后又撤掉时监听会摘干净", () => {
        const { rerender } = render(
          <Comp
            xAxisData={X_AXIS}
            seriesData={SERIES}
            onLegendSelectChanged={() => {}}
          />,
        );
        expect(listenerCount("legendselectchanged")).toBe(1);

        rerender(<Comp xAxisData={X_AXIS} seriesData={SERIES} />);
        expect(listenerCount("legendselectchanged")).toBe(0);
      });
    });
  }
});

describe("Chart.Sankey / Chart.Tree 的 getImage", () => {
  it("Sankey：getImage 换引用不重新 setOption，出图时调到的是最新的那个", () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = render(
      <ChartSankey
        seriesData={SANKEY_NODES}
        seriesLinks={SANKEY_LINKS}
        getImage={first}
      />,
    );
    const before = chart.setOption.mock.calls.length;

    rerender(
      <ChartSankey
        seriesData={SANKEY_NODES}
        seriesLinks={SANKEY_LINKS}
        getImage={second}
      />,
    );
    // 出图回调不是画图的输入，换引用不该让图重画
    expect(chart.setOption.mock.calls.length).toBe(before);

    emit("finished");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("Sankey：内联 getImage 把图存进 state 不会死循环", () => {
    const spy = vi.fn();

    function Consumer() {
      const [, setImg] = useState("");

      return (
        <ChartSankey
          seriesData={SANKEY_NODES}
          seriesLinks={SANKEY_LINKS}
          getImage={(img) => {
            spy(img);
            setImg(img);
          }}
        />
      );
    }

    render(<Consumer />);
    emit("finished");
    emit("finished");

    // finished 触发几次就回调几次，不会自激放大
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("Tree：getImage 换引用不重新 setOption，出图时调到的是最新的那个", () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = render(
      <ChartTree seriesData={TREE_DATA} getImage={first} />,
    );
    const before = chart.setOption.mock.calls.length;

    rerender(<ChartTree seriesData={TREE_DATA} getImage={second} />);
    expect(chart.setOption.mock.calls.length).toBe(before);

    emit("finished");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("Tree：从无到有传入 getImage 时仍能拿到图", () => {
    const spy = vi.fn();
    const { rerender } = render(<ChartTree seriesData={TREE_DATA} />);

    emit("finished");
    expect(spy).not.toHaveBeenCalled();

    rerender(<ChartTree seriesData={TREE_DATA} getImage={spy} />);
    emit("finished");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("Chart.Pie 的 onClick", () => {
  it("换引用不重复注册，且调到最新引用", () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = render(
      <ChartPie seriesData={PIE_DATA} onClick={first} />,
    );
    expect(listenerCount("click")).toBe(1);

    rerender(<ChartPie seriesData={PIE_DATA} onClick={second} />);
    expect(listenerCount("click")).toBe(1);

    emit("click", { name: "a" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("从无到有传入 onClick 时仍会注册", () => {
    const spy = vi.fn();
    const { rerender } = render(<ChartPie seriesData={PIE_DATA} />);
    expect(listenerCount("click")).toBe(0);

    rerender(<ChartPie seriesData={PIE_DATA} onClick={spy} />);
    expect(listenerCount("click")).toBe(1);

    emit("click", { name: "a" });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
