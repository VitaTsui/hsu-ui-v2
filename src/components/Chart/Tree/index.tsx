import React, { useCallback, useEffect, useMemo, useRef } from "react";
import useContainerReady from "../_hooks/useContainerReady";
import styles from "../index.module.scss";
import {
  ChartCommonProps,
  ChartOptionType,
  ChartsOption,
  SeriesData,
} from "..";
import * as echarts from "echarts";
import { deepCopy } from "hsu-utils";
import { handleTreeData } from "../_utils/tree";

export interface ChartTreeProps extends ChartCommonProps {
  seriesData: SeriesData[];
  getImage?: (img: string) => void;
}

const Tree: React.FC<ChartTreeProps> = (props) => {
  const { className, style, seriesData, series, getImage } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Cache the chart option with useMemo
  const chartOption = useMemo(() => {
    const option: ChartsOption = {
      series: {
        type: "tree",
        data: handleTreeData(deepCopy(seriesData), 0),
        left: "10%",
        right: "10%",
        top: "10%",
        bottom: "10%",
        ...series,
      } as ChartOptionType,
    };

    return option;
  }, [seriesData, series]);

  // Callback handling chart resize
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

    // Initialize a new instance or reuse the existing one
    let chart = chartInstanceRef.current;
    if (!chart) {
      chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      // Attach the finished event listener on first initialization
      chart.on("finished", () => {
        getImage?.(
          chart!.getDataURL({
            type: "png",
            pixelRatio: 1,
            backgroundColor: "#fff",
          })
        );
      });
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
  }, [chartOption, handleResize, getImage,
    containerReady,
  ]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      // Clean up the ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      // Dispose the chart instance
      if (chartInstanceRef.current) {
        chartInstanceRef.current.off("finished");
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

export default Tree;
