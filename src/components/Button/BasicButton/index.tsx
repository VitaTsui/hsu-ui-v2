import React, { ReactNode, forwardRef } from "react";

import usePermissions from "../../../hooks/usePermissions";
import classNames from "classnames";
import styles from "./index.module.scss";

/** Visual treatment. Mirrors the variant names the Chakra-backed button used to expose. */
export type BasicButtonVariant =
  | "solid"
  | "subtle"
  | "surface"
  | "outline"
  | "ghost"
  | "plain";

export type BasicButtonSize = "xs" | "sm" | "md" | "lg";

/**
 * Semantic colour of the button. `gray` is the neutral default and follows `--vita-foreground`, so it
 * inverts with the theme on its own.
 */
export type BasicButtonPalette = "gray" | "blue" | "red" | "green" | "orange";

export interface BasicButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Permission codes; the button does not render when the current user lacks them */
  hasPermi?: string[];
  /** Do not render at all */
  hidden?: boolean;
  variant?: BasicButtonVariant;
  size?: BasicButtonSize;
  colorPalette?: BasicButtonPalette;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  /** Falls back to the button label when `children` is empty */
  title?: ReactNode;
  /** Wrap the rendered button, e.g. to put it inside a Tooltip or Popconfirm */
  reRender?: (btn: React.ReactElement) => ReactNode;
}

/**
 * The library's own button, used by `Button.Basic` and by the toolbar / search button groups.
 *
 * It replaces the previous Chakra-backed implementation: chakra served exactly one component here
 * yet dragged `@chakra-ui/react` + `@emotion/*` + zag-js (~560 KB) into the dependency tree, and
 * because `ChakraRoot` created its system with `preflight: false` the buttons never got a reset —
 * they rendered with the UA's `border-style: outset` and, for `outline`, the UA `buttonface`
 * background. This version is ~100 lines of SCSS driven by the library's own design tokens.
 */
const BasicButton = forwardRef<HTMLButtonElement, BasicButtonProps>(
  (props, ref) => {
    const {
      hasPermi,
      hidden,
      variant = "solid",
      size = "md",
      colorPalette = "gray",
      icon,
      iconPosition = "start",
      className,
      children,
      title,
      reRender,
      type = "button",
      ...buttonConfig
    } = props;
    const { permitted } = usePermissions(hasPermi);

    if (!permitted || hidden) {
      return null;
    }

    const button = (
      <button
        {...buttonConfig}
        ref={ref}
        type={type}
        className={classNames(
          styles.button,
          styles[variant],
          styles[size],
          styles[colorPalette],
          className
        )}
      >
        {iconPosition === "start" && icon && (
          <span className={styles.icon}>{icon}</span>
        )}
        {children ?? title}
        {iconPosition === "end" && icon && (
          <span className={styles.icon}>{icon}</span>
        )}
      </button>
    );

    return <>{reRender ? reRender(button) : button}</>;
  }
);

BasicButton.displayName = "BasicButton";

export default BasicButton;
