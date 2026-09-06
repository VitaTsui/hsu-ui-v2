import * as echarts from "echarts";
import useContainerReady from "../_hooks/useContainerReady";

import {
  ChartCommonProps,
  ChartOptionType,
  ChartsOption,
  SeriesDataType,
} from "..";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

import styles from "../index.module.scss";
import { autoScrollLegend } from "../_utils/autoScrollLegend";
import { autoScrollByItem } from "../_utils/autoSmooth";
import {
  buildCartesianSeriesOptions,
  ChartScrollConfig,
  createDefaultCategoryXAxis,
  createDefaultValueYAxis,
  DataZoomIndexWindow,
  getSliderShow,
  percentWindowToIndexWindow,
  resolveScrollConfig,
} from "../_utils/cartesian";
import { resolveChartChrome } from "../_utils/chartTheme";
import useIsDark from "../../../hooks/useIsDark";
import useLatestRef from "../../../hooks/useLatestRef";

export interface ChartBarProps extends ChartCommonProps {
  chartTitle?: string;
  xAxisData?: Array<string>;
  seriesData?: SeriesDataType;
  legendData?: string[];
  scrollConfig?: ChartScrollConfig;
  onClick?: (event: echarts.ECElementEvent) => void;
  /** Legend selection change callback; the argument is the current selected state of each series (combined with legend.selected, enables axis recalculation) */
  onLegendSelectChanged?: (selected: Record<string, boolean>) => void;
  /** dataZoom visible-window change callback (fired by slider/wheel/auto-scroll/initial sync); the argument is the currently visible x-axis index range (combined with useDataZoomWindow, enables recalculating axes based on the displayed portion) */
  onDataZoomWindowChanged?: (window: DataZoomIndexWindow) => void;
  /** Whether to enable legend auto-scroll, default false */
  enableLegendAutoScroll?: boolean;
  /** Number of legend items visible per page, default 8 */
  legendVisibleCount?: number;
  /** Legend scroll interval (ms), default 1500 */
  legendScrollInterval?: number;
}

const ChartBar: React.FC<ChartBarProps> = (props) => {
  const {
    className,
    style,
    chartTitle,
    xAxisData,
    seriesData,
    legendData,
    legend,
    grid,
    tooltip,
    xAxis,
    yAxis,
    series,
    title,
    scrollConfig,
    dataZoom,
    insideDataZoom,
    sliderDataZoom,
    onClick,
    onLegendSelectChanged,
    onDataZoomWindowChanged,
    enableLegendAutoScroll = false,
    legendVisibleCount = 8,
    legendScrollInterval = 1500,
    ...coreOption
  } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const prevXAxisKeyRef = useRef<string | null>(null);
  const legendScrollRef = useRef<ReturnType<typeof autoScrollLegend> | null>(
    null,
  );
  const normalizedScroll = useMemo(
    () => resolveScrollConfig(scrollConfig),
    [scrollConfig],
  );
  // echarts options are plain JS and cannot read the `--vita-*` variables, so the axis and
  // legend colours have to be resolved against the active appearance here
  const isDark = useIsDark();
  const chrome = useMemo(() => resolveChartChrome(isDark), [isDark]);

  // 回调 prop 一律走 useLatestRef，不进依赖数组：消费方传内联箭头（React 里最常见的
  // 写法）时每次渲染都是新引用，进依赖数组会让「init + setOption(notMerge)」整段重跑，
  // 还会把当前可视窗口再同步一次给父级 —— 父级据此改 state 就是死循环。
  // 但「有没有传回调」决定要不要注册监听，所以单独拆成布尔量进依赖数组，
  // 这样「从无到有传入回调」仍会重新注册，不会漏。
  const onClickRef = useLatestRef(onClick);
  const onLegendSelectChangedRef = useLatestRef(onLegendSelectChanged);
  const onDataZoomWindowChangedRef = useLatestRef(onDataZoomWindowChanged);
  const hasOnClick = !!onClick;
  const hasOnLegendSelectChanged = !!onLegendSelectChanged;
  const hasOnDataZoomWindowChanged = !!onDataZoomWindowChanged;
  // 已通知过父级的窗口用 ref 记账（不参与渲染）：窗口没变就不再通知，
  // 掐断「通知 → 父级重算坐标轴 → chartOption 变 → effect 重跑 → 再通知」的自激回路
  const notifiedZoomWindowRef = useRef<DataZoomIndexWindow | null>(null);
  const emitZoomWindow = useCallback(
    (next: DataZoomIndexWindow) => {
      const prev = notifiedZoomWindowRef.current;
      if (
        prev &&
        prev.startIndex === next.startIndex &&
        prev.endIndex === next.endIndex
      ) {
        return;
      }
      notifiedZoomWindowRef.current = next;
      onDataZoomWindowChangedRef.current?.(next);
    },
    [onDataZoomWindowChangedRef],
  );

  // Cache the chart option with useMemo
  const chartOption = useMemo(() => {
    const def_xAxis = createDefaultCategoryXAxis(xAxisData, chrome);
    const def_yAxis = createDefaultValueYAxis("bar", chrome);

    // Process xAxis config
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
    const processedYAxis = Array.isArray(yAxis)
      ? yAxis?.map((item) => ({
          ...def_yAxis,
          data: item?.type === "category" ? xAxisData : undefined,
          ...item,
        }))
      : {
          ...def_yAxis,
          data: yAxis?.type === "category" ? xAxisData : undefined,
          ...yAxis,
        };

    // Compute grid config
    let gridTop: string | undefined = "5%";
    if ((yAxis as ChartOptionType)?.name) {
      gridTop = "15%";
    }

    const gridConfig: echarts.GridComponentOption = {
      top: gridTop,
      left: "5%",
      right: "5%",
      bottom: "5%",
      containLabel: true,
      ...grid,
    };

    if (chartTitle) {
      delete gridConfig.top;
    }

    // Process dataZoom config
    const totalLen = xAxisData?.length ?? 1;
    const {
      zoomEnabled,
      autoScroll,
      windowSize,
      startIndex: resolvedStartIndex,
      sliderVisible: sliderVisibleInConfig,
    } = normalizedScroll;
    const windowSizePercent = Number(
      ((windowSize / totalLen) * 100).toFixed(0),
    );
    const zoomStartIndex = resolvedStartIndex;
    const clampedStart = Math.max(
      0,
      Math.min(zoomStartIndex, Math.max(0, totalLen - 1)),
    );
    const zoomStartPercent = totalLen > 0 ? (clampedStart / totalLen) * 100 : 0;
    const zoomEndPercent = Math.min(zoomStartPercent + windowSizePercent, 100);

    const sliderFromDataZoom = Array.isArray(dataZoom)
      ? dataZoom.find((item) => item.type === "slider")
      : dataZoom || {};
    const insideFromDataZoom = Array.isArray(dataZoom)
      ? dataZoom.find((item) => item.type === "inside")
      : dataZoom || {};
    const requestedSliderVisible =
      sliderVisibleInConfig ??
      getSliderShow(sliderDataZoom) ??
      getSliderShow(sliderFromDataZoom) ??
      false;
    const finalSliderVisible = autoScroll ? false : requestedSliderVisible;
    const enableCustomWheelScroll =
      normalizedScroll.wheelModeWhenSliderHidden === "scroll" &&
      (autoScroll || !finalSliderVisible);
    const processedDataZoom = zoomEnabled
      ? [
          {
            type: "inside",
            ...(insideFromDataZoom || {}),
            ...(insideDataZoom || {}),
            start: zoomStartPercent,
            end: zoomEndPercent,
            ...(autoScroll ? { zoomLock: true } : {}),
            ...(enableCustomWheelScroll
              ? { zoomOnMouseWheel: false, moveOnMouseWheel: false }
              : {}),
          },
          {
            type: "slider",
            ...(sliderFromDataZoom || {}),
            ...(sliderDataZoom || {}),
            start: zoomStartPercent,
            end: zoomEndPercent,
            show: finalSliderVisible,
          },
        ]
      : undefined;

    const option: ChartsOption = {
      title: {
        text: chartTitle,
        textStyle: {
          fontSize: 18,
          color: "#333",
        },
        ...title,
      },
      grid: gridConfig,
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        ...tooltip,
      },
      legend: (() => {
        const baseLegend: echarts.LegendComponentOption = {
          top: "5%",
          data: legendData,
          icon: "circle",
          textStyle: {
            color: chrome.text,
          },
          itemWidth: 8,
          itemHeight: 8,
          ...legend,
        };
        if (enableLegendAutoScroll) {
          return {
            ...baseLegend,
            type: "scroll",
            pageIconSize: 0,
            pageIconColor: "transparent",
            pageIconInactiveColor: "transparent",
            pageTextStyle: {
              color: "transparent",
            },
          };
        }
        return baseLegend;
      })(),
      xAxis: processedXAxis,
      yAxis: processedYAxis,
      dataZoom: processedDataZoom,
      series: buildCartesianSeriesOptions("bar", seriesData, series),
      ...coreOption,
    } as ChartsOption;

    return option;
  }, [
    xAxisData,
    xAxis,
    yAxis,
    grid,
    chartTitle,
    dataZoom,
    normalizedScroll,
    insideDataZoom,
    sliderDataZoom,
    title,
    tooltip,
    legendData,
    legend,
    seriesData,
    series,
    enableLegendAutoScroll,
    coreOption,
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
    }

    // Set the option: notMerge resets the dataZoom window to its initial position,
    // so when x-axis data is unchanged (e.g. re-render triggered by axis recalculation / legend selection), record the current window first and restore it afterwards
    const xAxisKey = xAxisData?.join("\u0001") ?? "";
    const sameXAxis = prevXAxisKeyRef.current === xAxisKey;
    const prevZoomRanges = sameXAxis
      ? ((chart.getOption() as ChartsOption | undefined)?.dataZoom as
          | Array<{ start?: number; end?: number }>
          | undefined)
      : undefined;
    // 滚动图例的翻页位置同样会被 notMerge 重置，x 轴未变时恢复，
    // 否则点一次图例、或坐标轴重算触发一次重渲染，图例就跳回第一页
    const prevLegendScrollIndex = sameXAxis
      ? (
          (chart.getOption() as ChartsOption | undefined)?.legend as
            | Array<{ scrollDataIndex?: number }>
            | undefined
        )?.[0]?.scrollDataIndex
      : undefined;
    prevXAxisKeyRef.current = xAxisKey;
    chart.setOption(chartOption as ChartOptionType, true);
    if (prevLegendScrollIndex) {
      chart.setOption({
        legend: { scrollDataIndex: prevLegendScrollIndex },
      } as unknown as ChartOptionType);
    }
    const nextZooms = (chartOption as ChartsOption).dataZoom;
    if (
      prevZoomRanges?.length &&
      Array.isArray(nextZooms) &&
      nextZooms.length === prevZoomRanges.length
    ) {
      chart.setOption({
        dataZoom: prevZoomRanges.map((z) => ({ start: z.start, end: z.end })),
      });
    }

    // Sync the current visible window to the caller (on initial render and after restore), used to recalculate axes based on the displayed portion
    if (hasOnDataZoomWindowChanged) {
      const zooms = (chart.getOption() as ChartsOption | undefined)
        ?.dataZoom as Array<{ start?: number; end?: number }> | undefined;
      const zoom = zooms?.[0];
      const totalLen = xAxisData?.length ?? 0;
      if (typeof zoom?.start === "number" && typeof zoom?.end === "number") {
        emitZoomWindow(
          percentWindowToIndexWindow(zoom.start, zoom.end, totalLen),
        );
      } else {
        // Without dataZoom (e.g. scrolling not enabled due to insufficient data) the window is the full range; sync once to avoid a stale old window
        emitZoomWindow({
          startIndex: 0,
          endIndex: Math.max(0, totalLen - 1),
        });
      }
    }

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Add ResizeObserver
    if (chartRef.current && !resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(chartRef.current);
    }

    // Add click event（注册与否看布尔量，实际调用取最新引用）
    const handleClick = (event: echarts.ECElementEvent) => {
      onClickRef.current?.(event);
    };
    if (hasOnClick) {
      chartInstanceRef.current?.on("click", handleClick);
    }

    // Legend selection event
    const handleLegendSelectChanged = (params: unknown) => {
      onLegendSelectChangedRef.current?.(
        (params as { selected: Record<string, boolean> }).selected,
      );
    };
    if (hasOnLegendSelectChanged) {
      chartInstanceRef.current?.on(
        "legendselectchanged",
        handleLegendSelectChanged,
      );
    }

    // Native dataZoom interaction (slider drag / inside zoom) → sync the visible window
    const handleDataZoom = (params: unknown) => {
      const raw = params as {
        start?: number;
        end?: number;
        startValue?: number;
        endValue?: number;
        batch?: Array<{
          start?: number;
          end?: number;
          startValue?: number;
          endValue?: number;
        }>;
      };
      const info = raw?.batch?.[0] ?? raw;
      if (
        typeof info?.startValue === "number" &&
        typeof info?.endValue === "number"
      ) {
        emitZoomWindow({
          startIndex: Math.max(0, Math.round(info.startValue)),
          endIndex: Math.max(0, Math.round(info.endValue)),
        });
      } else if (
        typeof info?.start === "number" &&
        typeof info?.end === "number"
      ) {
        emitZoomWindow(
          percentWindowToIndexWindow(
            info.start,
            info.end,
            xAxisData?.length ?? 0,
          ),
        );
      }
    };
    if (hasOnDataZoomWindowChanged) {
      chartInstanceRef.current?.on("datazoom", handleDataZoom);
    }

    // Legend auto-scroll (modeled on the Pie component)
    const opt = chartOption as ChartsOption;
    const legendDataLen = Array.isArray(opt.legend)
      ? opt.legend[0]?.data?.length
      : (opt.legend as echarts.LegendComponentOption)?.data?.length;
    const seriesLen = Array.isArray(opt.series)
      ? opt.series.length
      : opt.series
        ? 1
        : 0;
    const legendTotal = legendDataLen ?? seriesLen ?? 0;
    if (enableLegendAutoScroll && chartInstanceRef.current && legendTotal > 0) {
      if (legendScrollRef.current) {
        legendScrollRef.current.dispose();
      }
      legendScrollRef.current = autoScrollLegend({
        chart: chartInstanceRef.current,
        total: legendTotal,
        visibleCount: legendVisibleCount,
        interval: legendScrollInterval,
        autoStart: true,
        // 滚轮已被 x 轴平移占用时不再让图例抢，否则一次滚动两处都动
        enableWheel:
          !normalizedScroll.zoomEnabled ||
          normalizedScroll.wheelModeWhenSliderHidden !== "scroll",
      });
    }

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);

      if (hasOnClick) {
        chartInstanceRef.current?.off("click", handleClick);
      }

      if (hasOnLegendSelectChanged) {
        chartInstanceRef.current?.off(
          "legendselectchanged",
          handleLegendSelectChanged,
        );
      }

      if (hasOnDataZoomWindowChanged) {
        chartInstanceRef.current?.off("datazoom", handleDataZoom);
      }

      if (legendScrollRef.current) {
        legendScrollRef.current.dispose();
        legendScrollRef.current = null;
      }
    };
  }, [
    chartOption,
    handleResize,
    onClickRef,
    onLegendSelectChangedRef,
    hasOnClick,
    hasOnLegendSelectChanged,
    hasOnDataZoomWindowChanged,
    emitZoomWindow,
    xAxisData,
    enableLegendAutoScroll,
    legendVisibleCount,
    legendScrollInterval,
    // 图例是否接管滚轮由它推导，漏了会拿到过期的滚动配置
    normalizedScroll,
    containerReady,
  ]);

  // Handle auto play
  useEffect(() => {
    if (
      !normalizedScroll.zoomEnabled ||
      !chartInstanceRef.current ||
      !xAxisData?.length
    )
      return;

    const sliderVisible =
      normalizedScroll.sliderVisible ??
      getSliderShow(sliderDataZoom) ??
      (Array.isArray(dataZoom)
        ? getSliderShow(dataZoom.find((item) => item.type === "slider"))
        : getSliderShow(dataZoom)) ??
      false;
    const enableWheelScroll =
      normalizedScroll.wheelModeWhenSliderHidden === "scroll" &&
      (normalizedScroll.autoScroll || !sliderVisible);
    const { dispose } = autoScrollByItem({
      chart: chartInstanceRef.current,
      xAxisData,
      windowSize: normalizedScroll.windowSize,
      interval: normalizedScroll.interval,
      startIndex: normalizedScroll.startIndex,
      autoPlay: normalizedScroll.autoScroll,
      enableWheelScroll,
      onWindowChange: hasOnDataZoomWindowChanged
        ? (startPercent, endPercent) =>
            emitZoomWindow(
              percentWindowToIndexWindow(
                startPercent,
                endPercent,
                xAxisData.length,
              ),
            )
        : undefined,
    });

    return dispose;
  }, [
    dataZoom,
    normalizedScroll,
    sliderDataZoom,
    xAxisData,
    hasOnDataZoomWindowChanged,
    emitZoomWindow,
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

export default ChartBar;
