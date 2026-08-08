import { Button as AntdButton, ButtonProps as AntdButtonProps } from "antd";

import React, { ReactNode } from "react";
import usePermissions from "../../hooks/usePermissions";
import classNames from "classnames";
import styles from "./index.module.scss";

/**
 * antd v6's own variants plus `surface` — a tinted background *with* a border.
 *
 * antd has no such variant: `filled` is tinted but explicitly sets `border-color: transparent`,
 * and `outlined` has the border but no tint. That combination is the one thing the old
 * Chakra-backed button was kept around for, so it lives here instead.
 */
export type ButtonVariant = NonNullable<AntdButtonProps["variant"]> | "surface";

export interface ButtonProps extends Omit<AntdButtonProps, "variant"> {
  hasPermi?: string[];
  hidden?: boolean;
  iconPosition?: "start" | "end";
  variant?: ButtonVariant;
  /**
   * @deprecated 用 antd 的 `color`。
   *
   * 这是 Chakra 时期的属性名，这里仍然接住并翻译成 `color`，否则它会一路透传到
   * `<button>` 上，React 会报 “does not recognize the colorPalette prop on a DOM element”。
   */
  colorPalette?: "gray" | "blue" | "red" | "green" | "orange";
  /** Wrap the rendered button, e.g. to put it inside a Tooltip or Popconfirm */
  reRender?: (btn: React.ReactElement) => ReactNode;
}

/**
 * @deprecated use `ButtonProps`.
 *
 * There used to be a second button (`Button.Chakra`, later `Button.Basic`) backed by Chakra UI,
 * brought in because antd v5's Button only had `type` and could not express variants like
 * outline / subtle / ghost. antd v6 added `color` (16 presets) and `variant`
 * (`solid | outlined | dashed | filled | text | link`) natively, which is exactly what that button
 * existed to provide — so it is gone and `Button` is the only button again.
 *
 * Mapping from the old props:
 * | old | new |
 * | --- | --- |
 * | `variant="solid"` | `variant="solid"` |
 * | `variant="outline"` | `variant="outlined"` |
 * | `variant="surface"` / `"subtle"` | `variant="filled"` |
 * | `variant="ghost"` | `variant="text"` |
 * | `variant="plain"` | `variant="link"` |
 * | `colorPalette="gray"` | `color="default"` |
 * | `colorPalette="blue" \| "red" \| "green" \| "orange"` | `color="blue" \| "red" \| "green" \| "orange"` |
 * | `size="xs" \| "sm" \| "md" \| "lg"` | `size="small" \| "small" \| "middle" \| "large"` |
 */
export type BasicButtonProps = ButtonProps;

/** @deprecated use `ButtonProps` — see the note on `BasicButtonProps` */
export type ChakraButtonProps = ButtonProps;

// forwardRef: when wrapped by overlay components like Tooltip / Popconfirm, the button DOM can be accessed directly,
// preventing rc libraries from falling back to findDOMNode and triggering React deprecation warnings
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    hasPermi,
    hidden,
    iconPosition = "start",
    className,
    children,
    title,
    variant,
    colorPalette,
    reRender,
    ...buttonConfig
  } = props;
  const { permitted } = usePermissions(hasPermi);

  if (!permitted || hidden) {
    return null;
  }

  // `surface` rides antd's `filled` so the whole colour ramp keeps working, and only puts the
  // border back — see `.surface` in index.module.scss.
  const isSurface = variant === "surface";

  // 旧的 colorPalette 翻译成 antd 的 color；gray 对应 antd 的 default，其余同名。
  const mappedColor =
    buttonConfig.color ??
    (colorPalette
      ? colorPalette === "gray"
        ? "default"
        : colorPalette
      : undefined);

  // antd only honours `variant` when `color` comes with it (`if (color && variant)` in its Button),
  // so `<Button variant="filled" />` on its own silently falls back to the default outlined look.
  // The one exception antd makes is `variant="solid"`, which it maps to the primary colour — that
  // is left alone so the prop keeps meaning what antd's docs say it means.
  const needsDefaultColor =
    !!variant &&
    variant !== "solid" &&
    !mappedColor &&
    !buttonConfig.type &&
    !buttonConfig.danger;

  const button = (
    <AntdButton
      {...buttonConfig}
      ref={ref}
      color={needsDefaultColor ? "default" : mappedColor}
      variant={isSurface ? "filled" : variant}
      className={classNames(className, styles.button, {
        [styles[iconPosition]]: iconPosition,
        [styles.surface]: isSurface,
      })}
      children={children ?? title}
    />
  );

  return <>{reRender ? reRender(button) : button}</>;
});

Button.displayName = "Button";

export default Button;
