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

/**
 * 2.0 之前的字段名。TS 字段是直接改名的，消费方写 `lightTokens.canvas` 会拿到
 * undefined 且没有任何提示，所以这里补上映射。
 *
 * （CSS 变量那侧原本也有一层 `--cf-*` 别名，2.3.0 起已移除，见 docs/guide.md。）
 *
 * `headerBg` 在重命名时被整个删掉了（没有对应的新名），这里指回 `surface`：2.0 之前
 * 两者在浅色下同为 #ffffff、暗色下同为卡片底色，语义上就是「顶栏用的面」。
 */
export interface LegacyThemeTokens {
  /** @deprecated 用 `background` */
  canvas: string;
  /** @deprecated 用 `muted` */
  subtle: string;
  /** @deprecated 用 `surface` */
  headerBg: string;
  /** @deprecated 用 `foreground` */
  text: string;
  /** @deprecated 用 `mutedForeground` */
  text2: string;
  /** @deprecated 用 `subtleForeground` */
  text3: string;
  /** @deprecated 用 `hover` */
  rowHover: string;
}

const withLegacy = (t: HsuThemeTokens): HsuThemeTokens & LegacyThemeTokens => ({
  ...t,
  canvas: t.background,
  subtle: t.muted,
  headerBg: t.surface,
  text: t.foreground,
  text2: t.mutedForeground,
  text3: t.subtleForeground,
  rowHover: t.hover,
});

export const lightTokens = withLegacy(raw.light);
export const darkTokens = withLegacy(raw.dark);

/** Default brand colour; consuming projects override it via `ConfigProvider.primaryColor` */
export const defaultPrimaryColor: string = raw.primary;

export const radius = raw.radius;
export const fontTokens = raw.font;
export const controlTokens = raw.control;

/**
 * 弹窗宽度尺度。此前各弹窗自己写死（ImportForm 600、SecondConf 800、ModalForm 800/1200），
 * 没有共同依据；收成一条尺度后至少有据可循。
 */
export const modalWidth = raw.modalWidth;

/**
 * 断点。与 `styles/_responsive.scss` 的 mixin 同源，所以 JS 判断不会和 CSS 媒体查询错开。
 */
export const breakpoints = raw.breakpoint;

/**
 * `#rgb` / `#rrggbb` → `rgba(...)`. Only used to keep antd's focus ring at the same opacity as
 * `--vita-ring`; anything it cannot parse is handed back untouched so antd falls back to deriving
 * the ring itself.
 */
/**
 * 把 hex 颜色加上透明度。传入不是 hex（例如已经是 rgba / CSS 变量）时原样返回，
 * 让调用方的值照常生效而不是变成 `NaN`。
 */
export const withAlpha = (color: string, alpha: number): string => {
  const hex = color.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!short && !long) return color;

  const [r, g, b] = short
    ? short.slice(1).map((c) => parseInt(c + c, 16))
    : long!.slice(1).map((c) => parseInt(c, 16));

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Opacity of the focus ring; mirrors `--vita-ring` in the generated tokens.scss */
const RING_ALPHA = 0.35;

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
    // antd 有四档文字色，本套令牌只有三档，压缩时分界线要放对：
    // tertiary 在 antd 里是**描述性的可读文字**（面包屑、表单 extra、Descriptions 的
    // 标签都吃它），quaternary 才是占位与禁用。原来两档都指向 subtleForeground，
    // 于是面包屑拿到了占位级的对比度 —— 浅色下 #a1a1aa 压白只有 2.56:1，
    // 14px 正文按 WCAG AA 要 4.5:1，连大字号的 3:1 都不到（消费方实测）。
    //
    // 压深 subtleForeground 治不了：要够 4.5:1 得到 #767676，那已经和
    // mutedForeground(#71717a, 4.83:1) 几乎同色，第三档等于不存在。
    // 所以按语义分流 —— 可读的归 muted，只有占位/禁用留在 subtle。
    colorTextTertiary: t.mutedForeground,
    colorTextQuaternary: t.subtleForeground,

    colorBgContainer: t.surface,
    colorBgElevated: t.surface,
    colorBgLayout: t.background,

    // `colorBgSpotlight` 故意不接管。它只服务 Tooltip，而 antd 把 Tooltip 的文字色写死成
    // `colorTextLightSolid`（白），底色必须是深色才读得出来——把它指到 `muted` 这种浅色
    // 中性面，亮色下就成了白字打在近白底上，整条提示语看不见。
    // antd 两套算法给的默认值本来就是深的（亮色 rgba(0,0,0,.85)、暗色抬亮的深灰），
    // 交回给它。

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
    borderRadiusXS: raw.radius.xs,

    fontFamily: raw.font.family,
    fontSize: raw.font.size,
    fontSizeSM: raw.font.sizeSm,
    fontSizeLG: raw.font.sizeLg,

    controlHeight: raw.control.height,
    controlHeightSM: raw.control.heightSm,
    controlHeightLG: raw.control.heightLg,
    // shadcn's focus treatment is a 2px ring rather than antd's soft glow. antd would otherwise
    // derive the ring colour itself at ~10% opacity, which reads visibly lighter than the
    // `--vita-ring` the wrapped components use — same control, two different focus states.
    //
    // 只动 controlOutline 与 colorErrorOutline 这两个「真的是 focus ring」的令牌。
    // 不要碰 controlTmpOutline —— 它在 antd 里是 colorFillQuaternary（中性填充），
    // 被 Button 拿去算默认按钮的底部阴影，把它设成错误色会让默认按钮长出一道红边。
    controlOutlineWidth: raw.control.ringWidth,
    controlOutline: withAlpha(primary, RING_ALPHA),
    colorErrorOutline: withAlpha(t.error, RING_ALPHA),

    boxShadow: t.shadow2,
    boxShadowSecondary: t.shadow3,
    boxShadowTertiary: t.shadow1,

    // shadcn leans on borders, not gradients or wireframe outlines
    wireframe: false,
  };
};

/**
 * 组件级令牌覆盖，补 `toAntdTheme` 里全局令牌覆盖不到的地方。
 */
export const toAntdComponents = (): ThemeConfig["components"] => ({
  // 划线：LG(12px) 留给真正的「容器」——弹窗、抽屉、卡片、上传投放区；
  // 与表单控件同处一行、体量相当的（表格、提示条）跟随基准值 8px，否则同屏两种圆角。
  Table: {
    borderRadiusLG: raw.radius.base,
  },
  Alert: {
    borderRadiusLG: raw.radius.base,
  },
  Button: {
    // antd 的按钮底部有一道 2px 的硬投影（`0 2px 0`），由 controlOutline / controlTmpOutline
    // 推导而来。shadcn 的按钮没有这个东西；而且既然我们把 controlOutline 调深到 35% 用作
    // focus ring，这道投影会跟着变成三倍重的一条色带。直接去掉，focus ring 不受影响。
    defaultShadow: "none",
    primaryShadow: "none",
    dangerShadow: "none",
  },
});
