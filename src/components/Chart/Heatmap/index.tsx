import React, { useCallback, useEffect, useMemo, useRef } from "react";
import useContainerReady from "../_hooks/useContainerReady";
import styles from "../index.module.scss";
import { ChartCommonProps, ChartOptionType, ChartsOption } from "..";
import * as echarts from "echarts";
import {
  createDefaultHeatmapXAxis,
  createDefaultHeatmapYAxis,
} from "../_utils/heatmap";
import { resolveChartChrome } from "../_utils/chartTheme";
import useIsDark from "../../../hooks/useIsDark";

export interface HeatmapDataItem {
  /** X-axis index or name */
  x: number | string;
  /** Y-axis index or name */
  y: number | string;
  /** Heat value (the actual business value; e.g. the tooltip should display this field) */
  value: number;
  /** Optional: used only for coloring and visualMap; defaults to value when omitted */
  visualWeight?: number;
}

export interface ChartHeatmapProps extends ChartCommonProps {
  /** Heatmap data, in [[x, y, value]] or HeatmapDataItem[] format */
  data: Array<[number, number, number]> | HeatmapDataItem[];
  /** X-axis data (category names) */
  xAxisData?: string[];
  /** Y-axis data (category names) */
  yAxisData?: string[];
  /** Chart title */
  chartTitle?: string;
  /** visualMap config */
  visualMap?: echarts.VisualMapComponentOption;
  /** Chart instance callback */
  onChart?: (chart: echarts.EChartsType) => void;
  /** Click event */
  onClick?: (event: echarts.ECElementEvent) => void;
  /** Color for zero values */
  zeroColor?: string | false;
  /** inRangeColor */
  inRangeColor?: string[];
}

const Heatmap: React.FC<ChartHeatmapProps> = (props) => {
  const {
    className,
    style,
    data,
    xAxisData,
    yAxisData,
    chartTitle,
    visualMap: propVisualMap,
    series,
    tooltip,
    title,
    grid,
    xAxis,
    yAxis,
    onChart,
    onClick,
    zeroColor,
    inRangeColor = [
      "#8BCCFB",
      "#75C3FB",
      "#5AB5F6",
      "#42AEFA",
      "#2DA1F5",
      "#0F89E1",
      "#056FBB",
      "#025794",
      "#0A4089",
    ],
    ...coreOption
  } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  // echarts options are plain JS and cannot read the `--vita-*` variables, so the axis and legend
  // colours have to be resolved against the active appearance here
  const isDark = useIsDark();
  const chrome = useMemo(() => resolveChartChrome(isDark), [isDark]);

  // Process the data and generate the chart option
  const chartOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {} as ChartsOption;
    }

    // Convert the data to the [[x, y, value]] format ECharts expects
    let processedData: Array<[number, number, number]>;
    if (Array.isArray(data) && data.length > 0) {
      if (Array.isArray(data[0])) {
        // Already in [[x, y, value]] format
        processedData = data as Array<[number, number, number]>;
      } else {
        // HeatmapDataItem[] format, needs conversion
        processedData = (data as HeatmapDataItem[])?.map((item) => {
          const xIndex =
            typeof item.x === "number"
              ? item.x
              : xAxisData?.indexOf(item.x as string) ?? 0;
          const yIndex =
            typeof item.y === "number"
              ? item.y
              : yAxisData?.indexOf(item.y as string) ?? 0;
          const z =
            item.visualWeight !== undefined ? item.visualWeight : item.value;
          return [xIndex, yIndex, z];
        });
      }
    } else {
      processedData = [];
    }

    // Compute the value range for visualMap
    const values = processedData?.map((item) => item[2]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Default visualMap config
    const defaultVisualMap: echarts.VisualMapComponentOption = {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: "vertical",
      left: "right",
      top: "center",
      textStyle: {
        color: chrome.text,
      },
      inRange: {
        color: inRangeColor,
      },
    };

    // Process xAxis config
    const def_xAxis = createDefaultHeatmapXAxis(xAxisData, chrome);
    const processedXAxis = Array.isArray(xAxis)
      ? xAxis?.map((item) => ({
          ...def_xAxis,
          data: item?.type === "value" ? undefined : xAxisData,
          ...item,
        }))
      : {
          ...def_xAxis,
          data: xAxis?.type === "value" ? undefined : xAxisData,
          ...xAxis,
        };

    // Process yAxis config
    const def_yAxis = createDefaultHeatmapYAxis(yAxisData, chrome);
    const processedYAxis = Array.isArray(yAxis)
      ? yAxis?.map((item) => ({
          ...def_yAxis,
          data: item?.type === "value" ? undefined : yAxisData,
          ...item,
        }))
      : {
          ...def_yAxis,
          data: yAxis?.type === "value" ? undefined : yAxisData,
          ...yAxis,
        };

    // Process visualMap config
    const finalVisualMap = {
      ...defaultVisualMap,
      ...propVisualMap,
    };

    // Compute grid config
    const gridConfig: echarts.GridComponentOption = {
      height: "95%",
      top: "5%",
      right: "5%",
      containLabel: true,
    };

    // Set the grid's right or bottom based on visualMap's visibility and orientation
    if (finalVisualMap.show !== false) {
      const orient = finalVisualMap.orient || defaultVisualMap.orient;
      if (orient === "vertical") {
        gridConfig.right = "15%";
      } else if (orient === "horizontal") {
        gridConfig.bottom = "15%";
      }
    }

    // Merge the user-provided grid config
    Object.assign(gridConfig, grid);

    const option: ChartsOption = {
      title: {
        text: chartTitle || "",
        ...title,
      },
      tooltip: {
        position: "top",
        ...tooltip,
      },
      grid: gridConfig,
      xAxis: processedXAxis,
      yAxis: processedYAxis,
      visualMap: finalVisualMap,
      series: [
        {
          type: "heatmap",
          data: processedData?.map((item) => {
            return {
              value: item,
              itemStyle: {
                color:
                  item[2] === 0
                    ? zeroColor === false
                      ? undefined
                      : zeroColor
                    : undefined,
              },
            };
          }),
          label: {
            show: true,
            position: "inside",
            color: "#fff",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          ...series,
        } as ChartOptionType,
      ],
      ...coreOption,
    };

    return option;
  }, [
    data,
    inRangeColor,
    xAxisData,
    xAxis,
    yAxisData,
    yAxis,
    propVisualMap,
    grid,
    chartTitle,
    title,
    tooltip,
    series,
    coreOption,
    zeroColor,
    chrome,
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

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);

      if (onClick) {
        chartInstanceRef.current?.off("click", onClick);
      }
    };
  }, [chartOption, handleResize, onChart, onClick,
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

export default Heatmap;
