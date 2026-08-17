import { darkTokens, fontTokens, lightTokens } from "../../../styles/tokens";

/**
 * Colours for the chart *chrome* — axis ticks, split lines, legend labels.
 *
 * echarts options are plain JS, so they cannot read the `--vita-*` CSS variables the rest of the
 * library styles itself with; the literal values have to be resolved here instead. These used to
 * be hard-coded to a light-mode slate (`#373D48` / `#C9CED6`), which left every axis and legend
 * nearly invisible once the page switched to the dark palette.
 *
 * The plotted data is deliberately *not* covered here: series colours come from echarts' own
 * palette or from whatever the caller passes as `color`, and both read fine on either background.
 */
export interface ChartChrome {
  /** Legend labels — a real label, so it sits on the foreground ramp */
  text: string;
  /** Axis tick labels — secondary information, one step down */
  axis: string;
  /** Split lines behind the plot area */
  splitLine: string;
  /** Base font size, same scale the rest of the library uses */
  fontSize: number;
}

export const resolveChartChrome = (dark: boolean): ChartChrome => {
  const t = dark ? darkTokens : lightTokens;

  return {
    text: t.foreground,
    axis: t.mutedForeground,
    splitLine: t.border,
    fontSize: fontTokens.size,
  };
};
