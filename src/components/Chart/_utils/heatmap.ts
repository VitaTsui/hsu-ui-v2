import { ChartOptionType } from "..";
import { ChartChrome } from "./chartTheme";

export const createDefaultHeatmapXAxis = (
  xAxisData: string[] | undefined,
  chrome: ChartChrome,
): ChartOptionType => ({
  type: "category",
  data: xAxisData,
  splitArea: {
    show: true,
  },
  axisLabel: {
    interval: 0,
    hideOverlap: true,
    // See the note in `cartesian.ts`: `axisLabel.textStyle` has been deprecated since echarts 4
    fontSize: chrome.fontSize,
    color: chrome.axis,
  },
  axisTick: {
    show: false,
  },
});

export const createDefaultHeatmapYAxis = (
  yAxisData: string[] | undefined,
  chrome: ChartChrome,
): ChartOptionType => ({
  type: "category",
  data: yAxisData,
  splitArea: {
    show: true,
  },
  axisLabel: {
    fontSize: chrome.fontSize,
    color: chrome.axis,
  },
  axisTick: {
    show: false,
  },
});
