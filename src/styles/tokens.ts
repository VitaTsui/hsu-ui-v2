/**
 * The JS half of the design-token layer.
 *
 * `tokens.json` is the single source of truth. This module types it and maps it onto antd's
 * `theme.token`; `scripts/gen-tokens-scss.cjs` maps the same file onto the `--vita-*` CSS
 * variables. Neither half is hand-written against the other, which is what let the previous
 * tokens.ts / tokens.scss pair drift (their headers literally said "the two must be kept in sync").
 *
 * Why antd needs the literal values rather than the CSS variables: `colorPrimary` is run through
 * @ant-design/colors to derive a 10-step palette, so it has to be a real colour. Handing it
 * `var(--vita-primary)` produces a palette of garbage. The practical consequence is that changing
 * the brand colour at runtime cannot be done by overriding the CSS variable alone — go through
 * `<ConfigProvider primaryColor={...}>`, which sets both halves at once.
 */
import type { ThemeConfig } from "antd";

import raw from "./tokens.json";

export interface HsuThemeTokens {
  /** Page canvas */
  background: string;
  /** Card / panel background */
  surface: string;
  /** Secondary background (table headers, read-only areas) */
  muted: string;
  border: string;
  borderWeak: string;
  /** Primary text */
  foreground: string;
  /** Secondary text */
  mutedForeground: string;
  /** Placeholder / disabled text */
  subtleForeground: string;
  /** Row / item hover background */
  hover: string;
  success: string;
  warning: string;
  error: string;
  shadow1: string;
  shadow2: string;
  shadow3: string;
}

export const lightTokens: HsuThemeTokens = raw.light;
export const darkTokens: HsuThemeTokens = raw.dark;

/** Default brand colour; consuming projects override it via `ConfigProvider.primaryColor` */
export const defaultPrimaryColor: string = raw.primary;

export const radius = raw.radius;
export const fontTokens = raw.font;
export const controlTokens = raw.control;

/**
 * Build antd's `theme.token` from the same tokens the CSS variables come from, so a component
 * this library has *not* wrapped still lands on the same palette, radii and type scale as one it
 * has. This is the lever that keeps the look consistent without wrapping all 75 antd components.
 */
export const toAntdTheme = (options?: {
  dark?: boolean;
  primaryColor?: string;
}): ThemeConfig["token"] => {
  const t = options?.dark ? darkTokens : lightTokens;
  const primary = options?.primaryColor ?? defaultPrimaryColor;

  return {
    colorPrimary: primary,
    colorSuccess: t.success,
    colorWarning: t.warning,
    colorError: t.error,
    colorInfo: primary,

    colorText: t.foreground,
    colorTextSecondary: t.mutedForeground,
    colorTextTertiary: t.subtleForeground,
    colorTextQuaternary: t.subtleForeground,

    colorBgContainer: t.surface,
    colorBgElevated: t.surface,
    colorBgLayout: t.background,
    colorBgSpotlight: t.muted,

    // antd paints table headers / filled controls from the Fill ramp; pointing the top of it at
    // `muted` is what keeps those surfaces on the zinc scale instead of antd's default greys.
    colorFillAlter: t.muted,
    colorFillSecondary: t.muted,
    colorFillTertiary: t.muted,
    colorFillQuaternary: t.hover,

    colorBorder: t.border,
    colorBorderSecondary: t.borderWeak,

    borderRadius: raw.radius.base,
    borderRadiusSM: raw.radius.sm,
    borderRadiusLG: raw.radius.lg,
    borderRadiusXS: raw.radius.sm,

    fontFamily: raw.font.family,
    fontSize: raw.font.size,
    fontSizeSM: raw.font.sizeSm,
    fontSizeLG: raw.font.sizeLg,

    controlHeight: raw.control.height,
    controlHeightSM: raw.control.heightSm,
    controlHeightLG: raw.control.heightLg,
    // shadcn's focus treatment is a 2px ring rather than antd's soft glow
    controlOutlineWidth: raw.control.ringWidth,

    boxShadow: t.shadow2,
    boxShadowSecondary: t.shadow3,
    boxShadowTertiary: t.shadow1,

    // shadcn leans on borders, not gradients or wireframe outlines
    wireframe: false,
  };
};
