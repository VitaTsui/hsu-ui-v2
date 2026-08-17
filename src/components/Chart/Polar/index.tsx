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

export interface ChartPolarProps extends ChartCommonProps {
  title1?: string;
  title1Style?: echarts.TitleComponentOption["textStyle"];
  title2?: string;
  title2Style?: echarts.TitleComponentOption["textStyle"];
  seriesData: SeriesData;
  color?: string[] | string;
}

const Polar: React.FC<ChartPolarProps> = (props) => {
  const {
    className,
    style,
    polar,
    radiusAxis,
    angleAxis,
    series,
    title1,
    title1Style,
    title2,
    title2Style,
    textStyle,
    seriesData,
    color = ["#00FFA3", "#00FFA3"],
    ...coreOption
  } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Cache the chart option with useMemo
  const chartOption = useMemo(() => {
    const option: ChartsOption = {
      title: [
        {
          left: "center",
          top: "45%",
          textVerticalAlign: "middle",
          textStyle: {
            fontSize: 18,
            color: "#333",
            rich: {
              a: {
                fontSize: 30,
                fontWeight: "bold",
                color: "#fff",
              },
              b: {
                fontSize: 18,
                color: "#fff",
              },
            },
            ...textStyle,
            ...title1Style,
          },
          text: title1 || "",
        },
        {
          left: "center",
          top: "90%",
          textVerticalAlign: "middle",
          textStyle: {
            rich: {
              a: {
                fontSize: 18,
                color: "rgba(255,255,255,0.7)",
                padding: [20, 0, 0, 0],
              },
            },
            ...textStyle,
            ...title2Style,
          },
          text: title2 || "",
        },
      ],
      tooltip: {
        show: false,
      },
      polar: {
        radius: ["60%", "80%"],
        center: ["50%", "45%"],
        ...polar,
      },
      radiusAxis: {
        type: "category",
        show: false,
        inverse: true,
        axisLabel: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        ...radiusAxis,
      },
      angleAxis: {
        max: 100,
        show: false,
        axisPointer: {
          show: false,
          label: {
            show: false,
          },
          lineStyle: {
            opacity: 0,
          },
        },
        ...angleAxis,
      },
      series: {
        type: "bar",
        name: seriesData.name,
        data: [seriesData.value],
        coordinateSystem: "polar",
        showBackground: true,
        roundCap: true,
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: Array.isArray(color) ? color[0] : color,
              },
              {
                offset: 1,
                color: Array.isArray(color) ? color[1] : color,
              },
            ],
            global: false,
          },
        },
        ...series,
      } as ChartOptionType,
      ...coreOption,
    };

    return option;
  }, [
    textStyle,
    title1Style,
    title1,
    title2Style,
    title2,
    polar,
    radiusAxis,
    angleAxis,
    seriesData,
    color,
    series,
    coreOption,
  ]);

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

export default Polar;
