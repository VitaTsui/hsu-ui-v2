import { describe, expect, it } from "vitest";

import tokens from "./tokens.json";

/**
 * 守的是这条**没有任何信号**的缺陷：文字令牌调浅了不报错、不告警，只是所有消费方的
 * 占位文字悄悄读不清。2.6.3 之前浅色 `subtleForeground` 压白只有 2.56:1，同时喂给
 * 占位与禁用两处，撑了很久没人发现。
 *
 * 判据用 WCAG 的原始公式现算，不写死颜色字面量 —— 写死的话换个色值它照样绿。
 *
 * 门槛按**用途**分，不按深浅分：
 * - 要读的文字（正文 / 次级 / 占位）：1.4.3 正文 4.5:1，一条豁免都不沾；
 * - 禁用态与装饰性图标：1.4.3 明文豁免非活动控件，但按 1.4.11 非文本仍要 3:1。
 */

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const luminance = (hex: string) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG 2.x 对比度 */
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** 控件启用态实际落在的两种底：卡片面与页面画布。禁用态的 `muted` 底不在此列（它被豁免） */
const SURFACES = {
  light: { surface: tokens.light.surface, background: tokens.light.background },
  dark: { surface: tokens.dark.surface, background: tokens.dark.background },
} as const;

const worstOn = (fg: string, theme: "light" | "dark") =>
  Math.min(...Object.values(SURFACES[theme]).map((bg) => contrast(fg, bg)));

describe.each(["light", "dark"] as const)("%s 主题的文字对比度", (theme) => {
  const t = tokens[theme];

  it("正文 foreground 远高于 AA", () => {
    expect(worstOn(t.foreground, theme)).toBeGreaterThanOrEqual(7);
  });

  it("次级文字 mutedForeground 过 AA 4.5:1", () => {
    expect(worstOn(t.mutedForeground, theme)).toBeGreaterThanOrEqual(4.5);
  });

  it("占位文字 placeholderForeground 过 AA 4.5:1（它是普通文字，不沾豁免）", () => {
    expect(worstOn(t.placeholderForeground, theme)).toBeGreaterThanOrEqual(4.5);
  });

  it("subtleForeground 过非文本的 3:1（它只服务禁用态与装饰性图标）", () => {
    expect(worstOn(t.subtleForeground, theme)).toBeGreaterThanOrEqual(3);
  });

  it("层次不许倒挂：foreground > muted >= placeholder > subtle", () => {
    const [fg, muted, ph, subtle] = (
      ["foreground", "mutedForeground", "placeholderForeground", "subtleForeground"] as const
    ).map((k) => worstOn(t[k], theme));

    expect(fg).toBeGreaterThan(muted);
    expect(muted).toBeGreaterThanOrEqual(ph);
    expect(ph).toBeGreaterThan(subtle);
  });
});
