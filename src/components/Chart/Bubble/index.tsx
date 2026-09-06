import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "../index.module.scss";
import { ChartCommonProps, ChartOptionType, ChartsOption } from "..";
import * as echarts from "echarts";
import {
  defaultBubbleColorList,
  drawCircles,
} from "../_utils/bubble";
import { useLatestRef } from "../../../hooks/useLatestRef";

export interface BubbleDataItem {
  name: string;
  value: number;
  [key: string]: unknown;
}

// Extended data item type containing all properties the chart needs
interface ExtendedBubbleDataItem extends BubbleDataItem {
  id: number;
  x?: number;
  y?: number;
  symbolSize?: number;
  label?: {
    normal: {
      show: boolean;
      color: string;
      fontSize?: number;
      width?: number;
      overflow?: "truncate" | "break" | "breakAll";
      ellipsis?: string;
    };
  };
  itemStyle?: {
    normal: {
      color: echarts.Color;
    };
  };
}

export interface ChartBubbleProps extends ChartCommonProps {
  /** Bubble chart data */
  data: BubbleDataItem[];
  /** Custom color list */
  colorList?: echarts.Color[];
  /** Chart title */
  chartTitle?: string;
  /** Bubble label font size */
  fontSize?: number;
  /** Chart instance callback */
  onChart?: (chart: echarts.EChartsType) => void;
  /** Click event */
  onClick?: (event: echarts.ECElementEvent) => void;
}

const Bubble: React.FC<ChartBubbleProps> = (props) => {
  const {
    className,
    style,
    data,
    colorList = defaultBubbleColorList,
    chartTitle,
    fontSize: propFontSize,
    series,
    tooltip,
    title,
    onChart,
    onClick,
    ...coreOption
  } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const layoutVersion = "ring-layout-v6-ellipse-tight";
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  // Cache the position calculation results
  const positionCacheRef = useRef<{
    cacheKey: string;
    positions: Array<{ x: number; y: number; radius: number }>;
  } | null>(null);

  // Generate a cache key based on data content and container size
  const generateCacheKey = useCallback(
    (data: BubbleDataItem[], width: number, height: number): string => {
      // Build the key from each item's name and value so data changes are detected
      const dataKey = data
        ?.map((item) => `${item.name}:${item.value}`)
        .join("|");
      return `${layoutVersion}_${dataKey}_${width}_${height}`;
    },
    [layoutVersion]
  );

  // Radius compensation used only for layout: when size differences are too large, give small bubbles extra layout radius to avoid being squeezed by big ones
  const getLayoutRadiusList = useCallback((rawRadiusList: number[]): number[] => {
    if (!rawRadiusList.length) return rawRadiusList;

    const validRadiusList = rawRadiusList.filter(
      (radius) => Number.isFinite(radius) && radius > 0
    );
    if (!validRadiusList.length) return rawRadiusList;

    const maxRadius = Math.max(...validRadiusList);
    const minRadius = Math.min(...validRadiusList);
    if (minRadius <= 0) return rawRadiusList;

    const ratio = maxRadius / minRadius;
    if (ratio <= 3) return rawRadiusList;

    const radiusDiff = maxRadius - minRadius;
    const compensationBase = Math.min(
      maxRadius * 0.32,
      Math.max(4, radiusDiff * 0.24)
    );

    return rawRadiusList.map((radius) => {
      if (!Number.isFinite(radius) || radius <= 0) return radius;
      const normalized = radiusDiff === 0 ? 1 : (radius - minRadius) / radiusDiff;
      const weight = 1 - normalized;
      return radius + compensationBase * weight;
    });
  }, []);

  // Process the data and generate the chart option
  const chartOption = useMemo(() => {
    // Return an empty option when the container size is not yet available or the data is empty
    if (
      !data ||
      data.length === 0 ||
      containerSize.width === 0 ||
      containerSize.height === 0
    ) {
      return {} as ChartsOption;
    }

    const colorListLen = colorList.length;
    const countList: ExtendedBubbleDataItem[] = data?.map((item, index) => ({
      ...item,
      id: index,
    }));

    // Compute the maximum value
    let max = 0;
    countList?.forEach((e) => {
      if (e.value >= max) max = e.value;
    });

    // Get the container size
    const graphCanvas = containerSize;

    // Base bubble size, dynamically adjusted by container size and data count
    const containerMin = Math.min(graphCanvas.width, graphCanvas.height);
    const containerArea = graphCanvas.width * graphCanvas.height;
    const dataCount = countList.length;

    // Dynamically adjust the base size by data count and container area
    // Goal: make bubbles as large as possible so the outward-expanding rings hug the container edge, while leaving necessary space for ring gaps.
    const areaPerBubble = containerArea / dataCount;
    const estimatedMaxRadius = Math.sqrt(areaPerBubble / Math.PI) * 0.82; // Higher density factor, larger bubbles

    // The more items there are, the smaller the base size, to avoid overlap
    const sizeFactor = Math.max(0.55, 1.35 - dataCount * 0.07);
    const baseSize = Math.min(
      170 * sizeFactor,
      containerMin / (1.9 + dataCount * 0.08),
      estimatedMaxRadius * 2 // Ensure it does not exceed the estimated max radius
    );

    // Adaptive non-linear mapping: compress large values and lift small ones, keeping the data gap readable while looking visually fuller
    const minPositiveValue = countList
      .map((item) => item.value)
      .filter((value) => value > 0)
      .reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY);
    const safeMinValue = Number.isFinite(minPositiveValue) ? minPositiveValue : 1;
    const valueRatio = max > 0 ? max / safeMinValue : 1;
    const compressPower =
      valueRatio > 20 ? 0.38 : valueRatio > 10 ? 0.46 : valueRatio > 4 ? 0.56 : 0.7;
    // Raise the floor for the smallest bubble so it is not too small to recognize, while keeping a visible gap from the largest value
    const minScale =
      valueRatio > 20 ? 0.74 : valueRatio > 10 ? 0.68 : valueRatio > 4 ? 0.62 : 0.56;
    const maxScale = 1.1;
    const symbolSizeList = countList.map((item) => {
      if (max <= 0) return baseSize * 0.6;
      const normalized = item.value > 0 ? item.value / max : 0;
      const compressed = Math.pow(normalized, compressPower);
      const scale = minScale + compressed * (maxScale - minScale);
      return Math.max(baseSize * 0.5, baseSize * scale);
    });

    const rawRadiusList = symbolSizeList.map((symbolSize) => symbolSize / 2);
    const layoutRadiusList = getLayoutRadiusList(rawRadiusList);

    // Generate the cache key
    const cacheKey = generateCacheKey(
      data,
      graphCanvas.width,
      graphCanvas.height
    );

    // Check the cache; if neither data nor container size changed, use the cached positions
    let randomCircleArr: Array<{ x: number; y: number; radius: number }>;
    if (
      positionCacheRef.current &&
      positionCacheRef.current.cacheKey === cacheKey &&
      positionCacheRef.current.positions.length === layoutRadiusList.length
    ) {
      // Use the cached positions
      randomCircleArr = positionCacheRef.current.positions;
    } else {
      // Recalculate positions
      randomCircleArr = drawCircles(
        layoutRadiusList,
        graphCanvas.width,
        graphCanvas.height
      );
      // Update the cache
      positionCacheRef.current = {
        cacheKey,
        positions: randomCircleArr,
      };
    }

    // Process each data item
    countList?.forEach((e, i) => {
      const symbolSize = symbolSizeList[i] ?? baseSize * 0.5;
      const fontSize = propFontSize ?? Math.max(12, Math.min(20, symbolSize * 0.28));

      // Compute symbolSize first, since the label's width depends on it
      let finalSymbolSize = symbolSize;
      if (randomCircleArr[i]) {
        e.x = randomCircleArr[i].x;
        e.y = randomCircleArr[i].y;
        e.symbolSize = symbolSize;
        finalSymbolSize = symbolSize;
      } else {
        // Fallback: place it at the container center
        e.symbolSize = symbolSize;
        e.x = graphCanvas.width / 2;
        e.y = graphCanvas.height / 2;
        finalSymbolSize = symbolSize;
      }

      e.label = {
        normal: {
          show: true,
          color: "#fff",
          fontSize,
          width: finalSymbolSize, // Set the width to the bubble diameter
          overflow: "truncate", // Truncate overflowing text
          ellipsis: "...", // Ellipsis
        },
      };

      e.emphasis = {
        label: {
          overflow: "none",
        },
      };

      e.itemStyle = {
        normal: {
          color: colorList[i % colorListLen], // Use the index to keep colors consistent
        },
      };
    });

    const option: ChartsOption = {
      title: {
        text: chartTitle || "",
        ...title,
      },
      tooltip: {
        trigger: "item",
        formatter: function (
          params: echarts.TooltipComponentFormatterCallbackParams
        ) {
          if (
            params &&
            typeof params === "object" &&
            "data" in params &&
            params.data &&
            typeof params.data === "object" &&
            "name" in params.data
          ) {
            const data = params.data as ExtendedBubbleDataItem;
            return "<b>" + data.name + "</b>：<b>" + data.value + " </b>";
          }
          return "";
        },
        ...tooltip,
      },
      series: [
        {
          type: "graph",
          layout: "none",
          label: {
            show: true,
            normal: {
              color: "#fff",
            },
          },
          data: countList,
          ...series,
        } as ChartOptionType,
      ],
      ...coreOption,
    };

    return option;
  }, [
    data,
    colorList,
    chartTitle,
    propFontSize,
    title,
    tooltip,
    series,
    coreOption,
    containerSize,
    generateCacheKey,
    getLayoutRadiusList,
  ]);

  // Set up a ResizeObserver to watch container size changes (including the initial size read)
  useEffect(() => {
    if (!chartRef.current) return;

    const containerElement = chartRef.current.parentElement;
    if (!containerElement) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize((prev) => {
          if (prev.width !== width || prev.height !== height) {
            return { width, height };
          }
          return prev;
        });
      }
    });

    observer.observe(containerElement);
    resizeObserverRef.current = observer;

    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, []);

  // Callback for handling chart resize
  const handleResize = useCallback(() => {
    chartInstanceRef.current?.resize();
    // Re-apply the option to update bubble positions
    if (chartInstanceRef.current && data && data.length > 0) {
      chartInstanceRef.current.setOption(chartOption as ChartOptionType, true);
    }
  }, [chartOption, data]);

  const onChartRef = useLatestRef(onChart);

  // 回调 prop 不进依赖数组：消费方传内联箭头时每次渲染都是新引用，effect 会跟着
  // 重跑并再调一次回调 —— 回调里 setState 就是死循环（详见 Input/TextArea 的说明）
  // Initialize the chart
  useEffect(() => {
    if (!chartRef.current) return;
    // Wait until the container size is valid before initializing the chart
    if (containerSize.width === 0 || containerSize.height === 0) return;

    // Initialize or reuse the existing instance
    let chart = chartInstanceRef.current;
    if (!chart) {
      chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;
      // Call the onChart callback on first initialization
      onChartRef.current?.(chart);
    }

    // Resize first so echarts picks up the correct container size, then apply the option
    chart.resize();
    chart.setOption(chartOption as ChartOptionType, true);

    // Add window resize listener
    window.addEventListener("resize", handleResize);

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
  }, [
    chartOption,
    containerSize.width,
    containerSize.height,
    handleResize,
    onChartRef,
    onClick,
  ]);

  // Dispose the chart instance when the component unmounts
  useEffect(() => {
    return () => {
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

export default Bubble;
