import * as echarts from "echarts";
import useContainerReady from "../_hooks/useContainerReady";

import {
  ChartCommonProps,
  ChartOptionType,
  ChartsOption,
  SeriesData,
} from "..";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

import styles from "../index.module.scss";

export interface ChartGaugeProps extends ChartCommonProps {
  color?: string[] | string;
  seriesData?: SeriesData[];
}

const Gauge: React.FC<ChartGaugeProps> = (props) => {
  const { className, style, series = {}, seriesData } = props;
  const {
    pointer,
    detail,
    axisLine,
    axisTick,
    splitLine,
    progress,
    axisLabel,
    title,
    color = "#1675FB",
    ...coreSeries
  } = series as echarts.GaugeSeriesOption;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Cache the chart option with useMemo
  const chartOption = useMemo(() => {
    const option: ChartsOption = {
      series: {
        type: "gauge",
        center: ["50%", "60%"],
        radius: "115%",
        color,
        pointer: {
          show: false,
          ...pointer,
        },
        detail: {
          show: true,
          offsetCenter: [0, "-10%"],
          color: "inherit",
          ...detail,
        },
        title: {
          show: true,
          offsetCenter: [0, "30%"],
          ...title,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: [[1, "#EAEDF2"]],
            width: 14,
          },
          ...axisLine,
        },
        axisTick: {
          show: false,
          ...axisTick,
        },
        progress: {
          show: true,
          roundCap: false,
          width: 14,
          ...progress,
        },
        splitLine: {
          show: false,
          ...splitLine,
        },
        axisLabel: {
          show: false,
          ...axisLabel,
        },
        data: seriesData,
        ...coreSeries,
      },
    };

    return option;
  }, [
    color,
    pointer,
    detail,
    title,
    axisLine,
    axisTick,
    progress,
    splitLine,
    axisLabel,
    seriesData,
    coreSeries,
  ]);

  // Callback for handling chart resize
  const handleResize = useCallback(() => {
    // A keep-alive tab losing focus fires the observer with a 0×0 box; resizing to that throws
    // the laid-out canvas away and it has to be rebuilt when the tab comes back
    const el = chartRef.current;
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;

    chartInstanceRef.current?.resize();
  }, []);

  // Initialize the chart
  useEffect(() => {
    if (!chartRef.current || !containerReady) return;

    // Initialize or reuse the existing instance
    let chart = chartInstanceRef.current;
    if (!chart) {
      chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;
    }

    // Apply the option
    chart.setOption(chartOption as ChartOptionType, true);

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Add ResizeObserver
    if (chartRef.current && !resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(chartRef.current);
    }

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [chartOption, handleResize,
    containerReady,
  ]);

  // Clean up resources when the component unmounts
  useEffect(() => {
    return () => {
      // Clean up ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      // Dispose the chart instance
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`${styles["chart-container"]} ${className ?? ""}`}
      style={style}
    >
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Gauge;
