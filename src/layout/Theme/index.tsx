import React, { useEffect, useMemo } from "react";
import { ConfigProvider as AntdConfigProvider, theme as antdTheme } from "antd";
import { observer } from "mobx-react-lite";
import classNames from "classnames";

import styles from "./index.module.scss";
import ThemeStore from "./ThemeStore";
import { lightTokens, darkTokens, withAlpha } from "../../styles/tokens";

export interface ThemeProps {
  children?: React.ReactNode;
  /** 深色导航渐变的两端色，不传用内置值 */
  navDarkColors?: { top: string; bottom: string };
}

/**
 * 外观控制器 + 布局专属配色。
 *
 * 这里刻意**不**做全局主题 —— 色板、圆角、字号、控件高度、明暗算法、focus ring 都由本库的
 * `ConfigProvider` 从设计令牌统一产出。这个组件只负责两件它独有的事：
 *
 * 1. **写 `html[data-theme]`**。令牌的 CSS 变量与 `useIsDark` 都监听这个属性，但**没有人写它** ——
 *    这是外观三态（light / dark / 跟随系统）落地的地方，也是这个组件存在的主要理由。
 * 2. **侧栏与导航的配色**。菜单选中态的胶囊、深色导航的渐变，这些是布局特有的，
 *    通用令牌覆盖不到，用一层就近的 antd ConfigProvider 叠加（antd 的嵌套规则：内层胜）。
 *
 * 移植时去掉的（本库已有，留着会重复甚至打架）：
 * - 自己包一层 antd ConfigProvider 做全局主题、切 darkAlgorithm  -> ConfigProvider
 * - hexToRgba                                                   -> styles/tokens 的 withAlpha
 * - 自存一份主题色（原来固定是青色）                                -> antd useToken 里当前生效的 colorPrimary
 * - matchMedia 监听系统深色                                       -> useIsDark
 * - borderRadius / colorBorder / Table / Card / Button / Input 等成套 token 覆盖 -> toAntdTheme
 * - 在包裹元素上内联重定义 --cf-*：那会盖掉 tokens.scss 生成的值，属于主动帮倒忙
 */
const Theme: React.FC<ThemeProps> = observer((props) => {
  const { children, navDarkColors } = props;
  const { isDark } = ThemeStore;

  const t = isDark ? darkTokens : lightTokens;

  // 主色取**当前生效**的那个，而不是自己再存一份 —— 消费方在 ConfigProvider 上换了
  // primaryColor，导航的选中态要跟着换，否则菜单会是一个和全站无关的颜色。
  const { token } = antdTheme.useToken();
  const primaryColor = token.colorPrimary;

  // 写 data-theme：CSS 变量与 useIsDark 都看它。
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  const themeConfig = useMemo(
    () => ({
      components: {
        Layout: {
          headerBg: t.surface,
          siderBg: t.surface,
        },
        Menu: {
          // 背景透明，好让导航的渐变透出来；选中态是一颗圆角胶囊
          darkItemBg: "transparent",
          darkSubMenuItemBg: "transparent",
          darkPopupBg: t.surface,
          darkItemColor: "rgba(255, 255, 255, 0.82)",
          darkItemHoverColor: "#ffffff",
          darkItemHoverBg: "rgba(255, 255, 255, 0.14)",
          darkItemSelectedBg: withAlpha(primaryColor, 0.16),
          darkItemSelectedColor: primaryColor,
          itemSelectedBg: withAlpha(primaryColor, 0.12),
          itemSelectedColor: primaryColor,
          itemActiveBg: withAlpha(primaryColor, 0.12),
          itemHoverBg: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0.04)",
          itemColor: t.foreground,
          itemBorderRadius: 6,
          itemMarginInline: 8,
          itemMarginBlock: 2,
          itemHeight: 38,
          horizontalItemHoverBg: "#0000000a",
        },
      },
    }),
    [isDark, primaryColor, t]
  );

  return (
    <AntdConfigProvider theme={themeConfig}>
      <div
        className={classNames(styles.theme, isDark ? "dark" : "light")}
        style={
          {
            "--nav-dark-top": navDarkColors?.top ?? "#1f1f1f",
            "--nav-dark-bottom": navDarkColors?.bottom ?? "#141414",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </AntdConfigProvider>
  );
});

Theme.displayName = "Theme";

export default Theme;
