import React, { useEffect, useMemo } from "react";
import {
  ConfigProvider as AntdConfigProvider,
  theme as antdTheme,
  type ThemeConfig,
} from "antd";

import { PermissionsContent } from "../hooks/usePermissions";
import useIsDark from "../hooks/useIsDark";
import { configureRequest, RequestImpl } from "../request";
import { toAntdComponents, toAntdTheme } from "../styles/tokens";
import { FeedbackHolder } from "../feedback";

export interface ConfigProviderProps {
  /** Current user's permission code list; when provided, usePermissions / hasPermi validate against it. If omitted, everything is allowed by default */
  permissions?: string[] | null;
  /** Inject the HTTP request implementation, used by smart components such as ImportForm */
  request?: Partial<RequestImpl>;
  /**
   * Brand colour. Sets both halves of the token layer at once: the `--vita-primary` CSS variable
   * (via `--primary-color`, so pre-2.0 overrides keep working) and antd's `colorPrimary`.
   *
   * Setting the CSS variable by hand only moves this library's own styles — antd derives a
   * 10-step palette from the JS token and cannot read a `var()`. Going through this prop is what
   * keeps the two in step.
   */
  primaryColor?: string;
  /**
   * Force light/dark instead of following `html[data-theme]` / the OS preference.
   * The CSS variables follow the same signals on their own.
   */
  dark?: boolean;
  /**
   * Extra antd theme config, merged on top of the generated one — escape hatch for a consumer
   * that wants a token this library does not map.
   */
  theme?: ThemeConfig;
  /**
   * Set to `false` to stop managing antd's theme entirely, leaving it to the host app.
   * Components this library wraps still follow the `--vita-*` variables; antd components it does
   * not wrap will fall back to antd's stock look.
   */
  antdTheme?: boolean;
  children?: React.ReactNode;
}

/**
 * Merge the library's per-component tokens with the consumer's, one level deeper than a spread.
 *
 * Spreading the two maps replaces a whole component block: an app that only wants
 * `Button.primaryColor` would silently lose the library's `Button.*Shadow: none` and get antd's
 * stock 2px shadow back under every button — no error, and nothing in the app's own theme to
 * explain it. Merging per component means an app overrides *tokens*, not blocks.
 */
const mergeComponents = (
  base: ThemeConfig["components"],
  extra: ThemeConfig["components"]
): ThemeConfig["components"] => {
  if (!extra) return base;

  const merged = { ...base } as Record<string, object | undefined>;
  for (const [name, tokens] of Object.entries(extra)) {
    merged[name] = { ...merged[name], ...tokens };
  }

  return merged as ThemeConfig["components"];
};

/**
 * Hsu UI global configuration: permissions, the request implementation, and the design tokens.
 *
 * On the theme: the `--vita-*` CSS variables cover everything this library styles itself, but not
 * the antd components it merely re-exports or that a page uses directly. Feeding antd's
 * `theme.token` from the very same tokens is what makes an unwrapped `<Steps />` land on the same
 * palette, radii and type scale as a wrapped `<Table />` — without this library having to wrap all
 * 75 antd components to keep the look consistent.
 *
 * @example
 * <ConfigProvider permissions={perms} request={{ get, post, del, put }} primaryColor="#7c3aed">
 *   <App />
 * </ConfigProvider>
 */
const ConfigProvider: React.FC<ConfigProviderProps> = ({
  permissions = null,
  request,
  primaryColor,
  dark,
  theme,
  antdTheme: manageAntdTheme = true,
  children,
}) => {
  // Inject synchronously during render so child components get the request implementation on their very first interaction
  useMemo(() => {
    if (request) configureRequest(request);
  }, [request]);

  const permissionsValue = useMemo(() => ({ permissions }), [permissions]);

  const detectedDark = useIsDark();
  const isDark = dark ?? detectedDark;

  const themeConfig = useMemo<ThemeConfig>(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      ...theme,
      token: { ...toAntdTheme({ dark: isDark, primaryColor }), ...theme?.token },
      components: mergeComponents(toAntdComponents(), theme?.components),
    }),
    [isDark, primaryColor, theme]
  );

  // Written onto <html> rather than a wrapper element: this provider usually sits at the very top
  // of the tree, and slipping an extra div in there would change the layout of whatever it wraps.
  // `--primary-color` rather than `--vita-primary` because the generated tokens make the latter
  // point at the former, so writing the legacy name keeps both spellings working for consumers.
  useEffect(() => {
    if (!primaryColor || typeof document === "undefined") return;

    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--primary-color");
    root.style.setProperty("--primary-color", primaryColor);

    return () => {
      if (previous) root.style.setProperty("--primary-color", previous);
      else root.style.removeProperty("--primary-color");
    };
  }, [primaryColor]);

  const tree = (
    <PermissionsContent.Provider value={permissionsValue}>
      {/* 让 message / notification / Modal.confirm 这类命令式 API 的输出落在树内，
          从而能读到下面注入的主题。见 ../feedback。 */}
      <FeedbackHolder />
      {children}
    </PermissionsContent.Provider>
  );

  if (!manageAntdTheme) return tree;

  return <AntdConfigProvider theme={themeConfig}>{tree}</AntdConfigProvider>;
};

export default ConfigProvider;
