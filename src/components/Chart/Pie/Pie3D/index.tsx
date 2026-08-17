import * as echarts from "echarts";
import useContainerReady from "../../_hooks/useContainerReady";
import "echarts-gl";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

import { ChartCommonProps, ChartOptionType, ChartsOption } from "../..";
import { useMouseOverHandler, useGlobalOutHandler } from "./_hooks";
import { getPie3DOption } from "./_utils/option";
import styles from "../../index.module.scss";

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
    tooltip = { show: false },
    label = { show: true },
    enableMouseControl = false,
    onChart,
    onClick,
    ...coreOption
  } = props;

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

  useEffect(() => {
    if (!chartRef.current || !containerReady) return;

    let chart = chartInstanceRef.current;
    if (!chart) {
      chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;
      onChart?.(chart);
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
    if (onClick) {
      chart.on("click", onClick);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chart) {
        chart.off("mouseover", handleMouseOver);
        chart.off("globalout", handleGlobalOut);
        if (onClick) {
          chart.off("click", onClick);
        }
      }
    };
  }, [
    chartOption,
    handleResize,
    handleMouseOver,
    handleGlobalOut,
    onChart,
    onClick,
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
