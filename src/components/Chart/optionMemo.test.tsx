import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

/**
 * 这一组用例盯的是 `chartOption` 那个 `useMemo` 的**依赖必须是值，不能是每次渲染
 * 新建的对象**。
 *
 * 依赖里一旦混进新建对象（`...coreOption` 这个 rest 包、或写在解构默认值里的
 * `= { show: false }` / `= ["#fff"]` 字面量），memo 就**恒不命中**：
 * 父组件每渲染一次 → chartOption 换新引用 → effect 重跑 → `setOption(…, true)`
 * 整个重设配置 —— 动画重播、鼠标悬浮态被清掉，用户直接看得见。
 *
 * 修法不是「让 effect 少跑」，而是让依赖回到值语义：
 * - rest 包走 `useShallowStable`（内容浅相等就复用同一个引用）；
 * - 解构默认值里的对象/数组字面量提到模块级常量。
 *
 * 所以每个组件都验两条：
 * 1. 父组件重渲染、props 未变 → 不再 setOption；
 * 2. 配置真变了（换数据）→ 仍然要 setOption。
 */

const chart = {
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  getDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
  getOption: vi.fn(() => ({ dataZoom: [{ start: 0, end: 100 }] })),
  on: vi.fn(),
  off: vi.fn(),
  dispatchAction: vi.fn(),
  getZr: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  convertToPixel: vi.fn(() => [0, 0]),
  getWidth: vi.fn(() => 600),
  getHeight: vi.fn(() => 400),
};

vi.mock("echarts", () => ({
  init: () => chart,
  use: () => {},
  registerTheme: () => {},
  graphic: {
    LinearGradient: class {
      constructor(..._args: unknown[]) {}
    },
  },
}));
vi.mock("echarts-gl", () => ({}));

import ChartBar from "./Bar";
import ChartLine from "./Line";
import ChartPie from "./Pie";
import ChartBubble from "./Bubble";
import ChartHeatmap from "./Heatmap";
import ChartPolar from "./Polar";
import ChartRadar from "./Radar";
import ChartCommon from "./Common";
import ChartGauge from "./Gauge";
import ChartPie3D from "./Pie/Pie3D";

// Chart.Bubble 要等 ResizeObserver 报出容器尺寸才会 init，jsdom 的空实现永远不回调，
// 这里补一个观察即回调的实现
class FiringResizeObserver {
  constructor(private cb: ResizeObserverCallback) {}
  observe(target: Element) {
    this.cb(
      [
        {
          target,
          contentRect: { width: 600, height: 400 },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  FiringResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
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
const SERIES_2 = [{ name: "A", value: [9, 9, 9, 9] }];
const PIE_DATA = [{ name: "a", value: 1 }];
const PIE_DATA_2 = [{ name: "a", value: 2 }];
const BUBBLE_DATA = [{ name: "a", value: 1 }];
const BUBBLE_DATA_2 = [{ name: "a", value: 5 }];
const HEATMAP_DATA: Array<[number, number, number]> = [[0, 0, 1]];
const HEATMAP_DATA_2: Array<[number, number, number]> = [[0, 0, 7]];
const RADAR_INDICATORS = [{ name: "a", max: 10 }];
const RADAR_DATA = [1];
const RADAR_DATA_2 = [8];
const POLAR_SERIES = { value: 1, name: "a" };
const POLAR_SERIES_2 = { value: 8, name: "a" };
const COMMON_SERIES = [{ type: "bar" as const, data: [1, 2, 3] }];
const COMMON_SERIES_2 = [{ type: "bar" as const, data: [4, 5, 6] }];
const GAUGE_DATA = [{ value: 1, name: "a" }];
const GAUGE_DATA_2 = [{ value: 6, name: "a" }];
const PIE3D_DATA = [{ name: "a", value: 1 }];
const PIE3D_DATA_2 = [{ name: "a", value: 4 }];

/** 每个组件：[名字, 组件, 稳定 props, 会真正改变配置的 props] */
const cases: Array<
  [string, React.ComponentType<Record<string, unknown>>, Record<string, unknown>, Record<string, unknown>]
> = [
  [
    "Chart.Bar",
    ChartBar as React.ComponentType<Record<string, unknown>>,
    { xAxisData: X_AXIS, seriesData: SERIES },
    { seriesData: SERIES_2 },
  ],
  [
    "Chart.Line",
    ChartLine as React.ComponentType<Record<string, unknown>>,
    { xAxisData: X_AXIS, seriesData: SERIES },
    { seriesData: SERIES_2 },
  ],
  [
    "Chart.Pie",
    ChartPie as React.ComponentType<Record<string, unknown>>,
    { seriesData: PIE_DATA },
    { seriesData: PIE_DATA_2 },
  ],
  [
    "Chart.Bubble",
    ChartBubble as React.ComponentType<Record<string, unknown>>,
    { data: BUBBLE_DATA },
    { data: BUBBLE_DATA_2 },
  ],
  [
    "Chart.Heatmap",
    ChartHeatmap as React.ComponentType<Record<string, unknown>>,
    { data: HEATMAP_DATA },
    { data: HEATMAP_DATA_2 },
  ],
  [
    "Chart.Polar",
    ChartPolar as React.ComponentType<Record<string, unknown>>,
    { seriesData: POLAR_SERIES },
    { seriesData: POLAR_SERIES_2 },
  ],
  [
    "Chart.Radar",
    ChartRadar as React.ComponentType<Record<string, unknown>>,
    { indicators: RADAR_INDICATORS, data: RADAR_DATA },
    { data: RADAR_DATA_2 },
  ],
  [
    "Chart.Gauge",
    ChartGauge as React.ComponentType<Record<string, unknown>>,
    { seriesData: GAUGE_DATA },
    { seriesData: GAUGE_DATA_2 },
  ],
  [
    "Chart.Pie.Three",
    ChartPie3D as React.ComponentType<Record<string, unknown>>,
    { pieData: PIE3D_DATA },
    { pieData: PIE3D_DATA_2 },
  ],
  [
    "Chart.Common",
    ChartCommon as React.ComponentType<Record<string, unknown>>,
    { xAxis: { type: "category" as const }, series: COMMON_SERIES },
    { series: COMMON_SERIES_2 },
  ],
];

describe("chartOption 的 useMemo 依赖必须是值", () => {
  for (const [name, Comp, stableProps, changedProps] of cases) {
    describe(name, () => {
      it("父组件重渲染但配置未变 → 不重设 option", () => {
        let bump: () => void = () => {};

        function Consumer() {
          const [, setTick] = useState(0);
          bump = () => setTick((n) => n + 1);

          return <Comp {...stableProps} />;
        }

        render(<Consumer />);
        const initial = chart.setOption.mock.calls.length;
        expect(initial).toBeGreaterThan(0);

        act(() => bump());
        act(() => bump());
        act(() => bump());

        expect(chart.setOption.mock.calls.length).toBe(initial);
      });

      it("配置真变了 → 仍然重设 option", () => {
        let change: () => void = () => {};

        function Consumer() {
          const [changed, setChanged] = useState(false);
          change = () => setChanged(true);

          return (
            <Comp
              {...stableProps}
              {...(changed ? changedProps : {})}
            />
          );
        }

        render(<Consumer />);
        const initial = chart.setOption.mock.calls.length;

        act(() => change());

        expect(chart.setOption.mock.calls.length).toBeGreaterThan(initial);
      });
    });
  }
});
