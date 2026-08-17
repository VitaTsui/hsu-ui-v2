import * as echarts from "echarts";
import { ChartOptionType, SeriesData, SeriesDataType } from "..";
import { ChartChrome } from "./chartTheme";

export interface ChartScrollConfig {
  enabled?: boolean;
  autoScroll?: boolean;
  windowSize?: number;
  interval?: number;
  startIndex?: number;
  sliderVisible?: boolean;
  wheelModeWhenSliderHidden?: "scroll" | "none";
}

export interface NormalizedScrollConfig {
  zoomEnabled: boolean;
  autoScroll: boolean;
  windowSize: number;
  interval: number;
  startIndex: number;
  sliderVisible?: boolean;
  wheelModeWhenSliderHidden: "scroll" | "none";
}

/** X-axis index range (closed interval) corresponding to the current visible dataZoom window */
export interface DataZoomIndexWindow {
  startIndex: number;
  endIndex: number;
}

/**
 * Converts dataZoom start/end percentages into an x-axis index window.
 * Follows the same percentage convention this component family writes to dataZoom (index / total * 100);
 * percentages produced by native echarts interactions are rounded outward, so each boundary may include at most one extra item, without affecting the axis magnitude.
 */
export const percentWindowToIndexWindow = (
  startPercent: number,
  endPercent: number,
  total: number,
): DataZoomIndexWindow => {
  if (total <= 0) return { startIndex: 0, endIndex: 0 };
  const startIndex = Math.max(
    0,
    Math.min(total - 1, Math.floor((startPercent / 100) * total)),
  );
  const endIndex = Math.max(
    startIndex,
    Math.min(total - 1, Math.ceil((endPercent / 100) * total) - 1),
  );
  return { startIndex, endIndex };
};

export const createDefaultCategoryXAxis = (
  xAxisData: Array<string> | undefined,
  chrome: ChartChrome,
): ChartOptionType => ({
  type: "category",
  boundaryGap: true,
  data: xAxisData,
  axisLabel: {
    interval: 0,
    hideOverlap: true,
    // echarts removed the `textStyle` nesting under `axisLabel` in v4: keeping it means both
    // properties are silently dropped *and* a deprecation warning is logged on every render.
    fontSize: chrome.fontSize,
    color: chrome.axis,
  },
  axisTick: {
    show: false,
  },
});

export const createDefaultValueYAxis = (
  mode: "bar" | "line" = "bar",
  chrome: ChartChrome,
): ChartOptionType => ({
  type: "value",
  axisLabel: {
    fontSize: chrome.fontSize,
    color: chrome.axis,
  },
  splitLine:
    mode === "line"
      ? {
          lineStyle: {
            color: chrome.splitLine,
            type: "dashed",
          },
        }
      : {
          show: false,
        },
});

export const buildCartesianSeriesOptions = (
  mode: "bar" | "line",
  seriesData?: SeriesDataType,
  series?: echarts.SeriesOption | echarts.SeriesOption[],
): echarts.SeriesOption[] => {
  const seriesStyle: echarts.SeriesOption =
    mode === "bar"
      ? ({
          type: "bar",
          barWidth: 20,
        } as echarts.BarSeriesOption)
      : ({
          type: "line",
          symbol: "circle",
          symbolSize: 8,
        } as echarts.LineSeriesOption);

  if (
    !seriesData ||
    seriesData.length === 0 ||
    typeof seriesData[0] !== "object"
  ) {
    if (Array.isArray(series)) {
      return series.map(
        (item): echarts.SeriesOption =>
          ({
            data: seriesData,
            ...seriesStyle,
            ...item,
          } as echarts.SeriesOption),
      );
    }

    return [
      {
        data: seriesData,
        ...seriesStyle,
        ...(series || {}),
      },
    ] as echarts.SeriesOption[];
  }

  const typedSeriesData = seriesData as SeriesData[];
  if (Array.isArray(series)) {
    return series.flatMap((item) =>
      typedSeriesData.map(
        (serie): echarts.SeriesOption =>
          ({
            name: serie?.name,
            data: serie?.value,
            ...seriesStyle,
            ...item,
            ...serie?.series,
          } as echarts.SeriesOption),
      ),
    );
  }

  return typedSeriesData.map(
    (serie): echarts.SeriesOption =>
      ({
        name: serie?.name,
        data: serie?.value,
        ...seriesStyle,
        ...(series || {}),
        ...serie?.series,
      } as echarts.SeriesOption),
  );
};

export const getSliderShow = (
  zoom?: echarts.DataZoomComponentOption | Record<string, unknown>,
) => {
  if (!zoom || typeof zoom !== "object") return undefined;
  const maybeShow = (zoom as { show?: unknown }).show;
  return typeof maybeShow === "boolean" ? maybeShow : undefined;
};

export const resolveScrollConfig = (
  scrollConfig?: ChartScrollConfig,
): NormalizedScrollConfig => ({
  zoomEnabled: scrollConfig?.enabled ?? false,
  autoScroll: scrollConfig?.autoScroll ?? false,
  windowSize: scrollConfig?.windowSize ?? 10,
  interval: scrollConfig?.interval ?? 2000,
  startIndex: scrollConfig?.startIndex ?? 0,
  sliderVisible: scrollConfig?.sliderVisible,
  wheelModeWhenSliderHidden:
    scrollConfig?.wheelModeWhenSliderHidden ?? "scroll",
});
