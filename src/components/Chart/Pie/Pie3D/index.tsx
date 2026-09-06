import * as echarts from "echarts";
import useContainerReady from "../../_hooks/useContainerReady";
import "echarts-gl";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

import { ChartCommonProps, ChartOptionType, ChartsOption } from "../..";
import { useMouseOverHandler, useGlobalOutHandler } from "./_hooks";
import { getPie3DOption } from "./_utils/option";
import styles from "../../index.module.scss";
import { useLatestRef } from "../../../../hooks/useLatestRef";
import useShallowStable from "../../../../hooks/useShallowStable";

export interface Pie3DDataItem {
  name: string;
  value: number;
  itemStyle?: {
    color?: string;
    opacity?: number;
  };
}

export interface LabelConfig {
  show?: boolean;
  distance?: number;
  formatter?: (params: {
    name: string;
    value: number;
    percent: number;
  }) => string;
  hideLine?: boolean;
  lineStyle?: {
    color?: string;
    width?: number;
  };
  textStyle?: {
    color?: string;
    fontSize?: number;
    padding?: number | number[];
  };
}

export interface ChartPie3DProps extends Omit<ChartCommonProps, "series"> {
  pieData: Pie3DDataItem[];
  internalDiameterRatio?: number;
  autoRotate?: boolean;
  distance?: number;
  alpha?: number;
  beta?: number;
  hoverHeightIncrement?: number;
  minHeight?: number;
  maxHeight?: number;
  yOffset?: number;
  label?: LabelConfig;
  enableMouseControl?: boolean;
  onChart?: (chart: echarts.EChartsType) => void;
  onClick?: (event: echarts.ECElementEvent) => void;
}

export interface PieStatus {
  selected: boolean;
  hovered: boolean;
  k: number;
}

export interface SeriesItem {
  name: string;
  type: "surface";
  parametric: boolean;
  wireframe: {
    show: boolean;
  };
  itemStyle?: {
    color?: string;
    opacity?: number;
  };
  pieData: Pie3DDataItem & {
    startRatio?: number;
    endRatio?: number;
  };
  pieStatus: PieStatus;
  parametricEquation?: {
    u: { min: number; max: number; step: number };
    v: { min: number; max: number; step: number };
    x: (u: number, v: number) => number;
    y: (u: number, v: number) => number;
    z: (u: number, v: number) => number;
  };
}

// 解构默认值写成字面量会每次渲染新建一个对象，进依赖数组就让 memo 恒不命中；提到模块级常量
const DEFAULT_TOOLTIP = { show: false };
const DEFAULT_LABEL: LabelConfig = { show: true };

const ChartPie3D: React.FC<ChartPie3DProps> = (props) => {
  const {
    className,
    style,
    pieData,
    internalDiameterRatio = 0.9,
    autoRotate = false,
    distance = 200,
    alpha = 20,
    beta = 0,
    hoverHeightIncrement = 5,
    minHeight = 1,
    maxHeight = 10,
    yOffset = -0.2,
    tooltip = DEFAULT_TOOLTIP,
    label = DEFAULT_LABEL,
    enableMouseControl = false,
    onChart,
    onClick,
    ...restOption
  } = props;
  // rest 解构出来的对象每次渲染都是新引用，直接进依赖数组会让 chartOption 的 memo
  // 恒不命中 —— 父组件每渲染一次就重跑一次 setOption(notMerge)，动画重播、悬浮态被清掉。
  // useShallowStable 让它回到值语义：内容浅相等就复用同一引用，真变了立刻透出新引用。
  const coreOption = useShallowStable(restOption);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const hoveredIndexRef = useRef<number | "">("");
  const optionRef = useRef<ChartsOption | null>(null);

  const chartOption = useMemo(() => {
    return getPie3DOption(pieData, {
      internalDiameterRatio,
      tooltip,
      alpha,
      beta,
      autoRotate,
      distance,
      coreOption,
      optionRef,
      minHeight,
      maxHeight,
      yOffset,
      label,
      enableMouseControl,
    });
  }, [
    pieData,
    internalDiameterRatio,
    tooltip,
    alpha,
    beta,
    autoRotate,
    distance,
    coreOption,
    minHeight,
    maxHeight,
    yOffset,
    label,
    enableMouseControl,
  ]);

  const handleResize = useCallback(() => {
    // A keep-alive tab losing focus fires the observer with a 0×0 box; resizing to that throws
    // the laid-out canvas away and it has to be rebuilt when the tab comes back
    const el = chartRef.current;
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;

    chartInstanceRef.current?.resize();
  }, []);

  const handleMouseOver = useMouseOverHandler(
    optionRef,
    chartInstanceRef,
    hoveredIndexRef,
    { hoverHeightIncrement, minHeight, maxHeight, yOffset, autoRotate }
  );

  const handleGlobalOut = useGlobalOutHandler(
    optionRef,
    chartInstanceRef,
    hoveredIndexRef,
    { minHeight, maxHeight, yOffset, autoRotate }
  );

  const onChartRef = useLatestRef(onChart);

  // onClick 不进依赖数组：消费方传内联箭头时每次渲染都是新引用，effect 跟着重跑会重建
  // 3D 饼的 option 并重播动画。注册与否看布尔量（保证「从无到有传入」仍会注册），
  // 实际调用取 ref 里的最新引用。
  const onClickRef = useLatestRef(onClick);
  const hasOnClick = !!onClick;

  // 回调 prop 不进依赖数组：消费方传内联箭头时每次渲染都是新引用，effect 会跟着
  // 重跑并再调一次回调 —— 回调里 setState 就是死循环（详见 Input/TextArea 的说明）
  useEffect(() => {
    if (!chartRef.current || !containerReady) return;

    let chart = chartInstanceRef.current;
    if (!chart) {
      chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;
      onChartRef.current?.(chart);
    }

    chart.setOption(chartOption as ChartOptionType, true);
    optionRef.current = chartOption;

    window.addEventListener("resize", handleResize);

    if (chartRef.current && !resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(chartRef.current);
    }

    chart.on("mouseover", handleMouseOver);
    chart.on("globalout", handleGlobalOut);
    const handleClick = (event: echarts.ECElementEvent) => {
      onClickRef.current?.(event);
    };
    if (hasOnClick) {
      chart.on("click", handleClick);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chart) {
        chart.off("mouseover", handleMouseOver);
        chart.off("globalout", handleGlobalOut);
        if (hasOnClick) {
          chart.off("click", handleClick);
        }
      }
    };
  }, [
    chartOption,
    handleResize,
    handleMouseOver,
    handleGlobalOut,
    onChartRef,
    onClickRef,
    hasOnClick,
    containerReady,
  ]);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`${styles["chart-container"]} ${className ?? ""}`}
      style={style as React.CSSProperties}
    >
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default ChartPie3D;
