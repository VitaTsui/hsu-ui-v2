import * as echarts from "echarts";
import useContainerReady from "../_hooks/useContainerReady";

import {
  ChartCommonProps,
  ChartOptionType,
  ChartsOption,
  Series,
  SeriesDataType,
} from "..";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { autoScrollLegend } from "../chartUtils";

import styles from "../index.module.scss";
import ChartPie3D, { ChartPie3DProps } from "./Pie3D";

export interface ChartPieProps extends ChartCommonProps {
  chartTitle?: string;
  seriesData?: SeriesDataType;
  onChart?: (chart: echarts.EChartsType) => void;
  extendSeries?: Series[];
  onClick?: (event: echarts.ECElementEvent) => void;
  /** Whether to enable legend auto-scroll, default false */
  enableLegendAutoScroll?: boolean;
  /** Number of legend items visible per page, default 8 */
  legendVisibleCount?: number;
  /** Legend scroll interval (ms), default 1500 */
  legendScrollInterval?: number;
  /** Whether it is a semicircle, default false */
  isSemiCircle?: boolean;
  /** Edge the semicircle is attached to, default 'bottom' */
  position?: "top" | "bottom" | "left" | "right";
  /** Display angle, default 180 */
  spanAngle?: number;
  /** Center position */
  center?: [string, string];
  /** Radius config */
  radius?: [string, string];
}

export interface ChartPieFC extends React.FC<ChartPieProps> {
  Three: React.FC<ChartPie3DProps>;
}

const ChartPie: ChartPieFC = (props) => {
  const {
    className,
    style,
    chartTitle,
    seriesData,
    legend,
    tooltip,
    series,
    title,
    onChart,
    extendSeries = [],
    onClick,
    enableLegendAutoScroll = false,
    legendVisibleCount = 8,
    legendScrollInterval = 1500,
    isSemiCircle = false,
    position = "bottom",
    spanAngle = 180,
    center,
    radius,
    ...coreOption
  } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const legendScrollRef = useRef<ReturnType<typeof autoScrollLegend> | null>(
    null
  );

  // Compute the default radius based on position (when not specified)
  const calculatedRadius = useMemo(() => {
    if (radius) {
      return radius;
    }

    // A semicircle needs a larger radius to fill the container,
    // because it spans only 180 degrees, so the outer radius must be larger to cover the container's full height or width
    if (isSemiCircle) {
      return ["0%", "200%"];
    }
    // Full circle
    return ["45%", "70%"];
  }, [radius, isSemiCircle]);

  // Compute angles and center position
  const { calculatedCenter, startAngle, endAngle, actualSpanAngle } =
    useMemo(() => {
      // Compute the default center based on position (when not specified)
      let calculatedCenter: [string, string] = center || ["30%", "50%"];
      let startAngle = 90;
      let endAngle = 450; // 360 + 90, starting from the top
      const actualSpanAngle = isSemiCircle ? spanAngle : 360;

      if (isSemiCircle) {
        // Compute angles and center position based on position
        switch (position) {
          case "top":
            // Top semicircle
            startAngle = 180;
            endAngle = 0;
            calculatedCenter = center || ["center", "0%"];
            break;
          case "bottom":
            // Bottom semicircle
            startAngle = 0;
            endAngle = 180;
            calculatedCenter = center || ["center", "100%"];
            break;
          case "left":
            // Left semicircle
            startAngle = 90;
            endAngle = 270;
            calculatedCenter = center || ["0%", "center"];
            break;
          case "right":
            // Right semicircle
            startAngle = 270;
            endAngle = 90;
            calculatedCenter = center || ["100%", "center"];
            break;
        }
      } else {
        // Full circle
        calculatedCenter = center || ["30%", "50%"];
      }

      return {
        calculatedCenter,
        startAngle,
        endAngle,
        actualSpanAngle,
      };
    }, [isSemiCircle, position, center, spanAngle]);

  // Process the data: a semicircle needs blank data padding
  const processedSeriesData = useMemo(() => {
    if (!seriesData || !isSemiCircle) {
      return seriesData;
    }

    const originDataLen = seriesData.length;
    const repeatedMultiple = 360 / actualSpanAngle;
    const addDataLen = parseInt(String((repeatedMultiple - 1) * originDataLen));

    // Pad with blank data to form the semicircle
    const emptyData = Array.from({ length: addDataLen }, () => ({
      value: 0,
      itemStyle: {
        color: "rgba(0,0,0,0)",
      },
      tooltip: {
        show: false,
      },
    }));

    return [...seriesData, ...emptyData] as SeriesDataType;
  }, [seriesData, isSemiCircle, actualSpanAngle]);

  // Cache the chart option with useMemo
  const chartOption = useMemo(() => {
    // When auto-scroll is enabled, hide the paging buttons and use the scroll type
    const baseLegendConfig: echarts.LegendComponentOption = {
      orient: "vertical",
      top: "middle",
      right: "5%",
      icon: "circle",
      textStyle: {
        color: "#7B7B7B",
        fontSize: 14,
      },
      ...legend,
    };

    const legendConfig: echarts.LegendComponentOption = enableLegendAutoScroll
      ? {
          ...baseLegendConfig,
          // Use the scroll type
          type: "scroll",
          // Config to hide the paging buttons
          pageIconSize: 0,
          pageIconColor: "transparent",
          pageIconInactiveColor: "transparent",
          pageTextStyle: {
            color: "transparent",
          },
        }
      : baseLegendConfig;

    const option: ChartsOption = {
      title: {
        left: "center",
        top: "center",
        textAlign: "center",
        text: chartTitle || "",
        ...title,
      },
      legend: legendConfig,
      tooltip: {
        trigger: "item",
        ...tooltip,
      },
      series: [
        {
          data: processedSeriesData,
          type: "pie",
          center: calculatedCenter,
          radius: calculatedRadius,
          startAngle,
          endAngle,
          clockwise: false,
          label: {
            show: false,
          },
          ...series,
        } as ChartOptionType,
        ...extendSeries,
      ],
      ...coreOption,
    };

    return option;
  }, [
    chartTitle,
    title,
    legend,
    tooltip,
    processedSeriesData,
    series,
    extendSeries,
    coreOption,
    enableLegendAutoScroll,
    calculatedCenter,
    calculatedRadius,
    startAngle,
    endAngle,
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
      // Call the onChart callback on first initialization
      onChart?.(chart);
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

    // Add click event
    if (onClick) {
      chartInstanceRef.current?.on("click", onClick);
    }

    // Legend auto-scroll
    if (enableLegendAutoScroll && seriesData && seriesData.length > 0) {
      // Dispose the previous scroll instance
      if (legendScrollRef.current) {
        legendScrollRef.current.dispose();
      }

      legendScrollRef.current = autoScrollLegend({
        chart,
        total: seriesData.length,
        visibleCount: legendVisibleCount,
        interval: legendScrollInterval,
        autoStart: true,
      });
    }

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);

      if (onClick) {
        chartInstanceRef.current?.off("click", onClick);
      }

      // Clean up legend scrolling
      if (legendScrollRef.current) {
        legendScrollRef.current.dispose();
        legendScrollRef.current = null;
      }
    };
  }, [
    chartOption,
    handleResize,
    onChart,
    onClick,
    enableLegendAutoScroll,
    seriesData,
    legendVisibleCount,
    legendScrollInterval,
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

ChartPie.Three = ChartPie3D;

export default ChartPie;
