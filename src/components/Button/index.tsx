import { Button as AntdButton, ButtonProps as AntdButtonProps } from "antd";

import React from "react";
import usePermissions from "../../hooks/usePermissions";
import classNames from "classnames";
import styles from "./index.module.scss";
import BasicButton from "./BasicButton";
import type { BasicButtonProps } from "./BasicButton";

export type {
  BasicButtonProps,
  BasicButtonVariant,
  BasicButtonSize,
  BasicButtonPalette,
} from "./BasicButton";

/**
 * @deprecated renamed to `BasicButtonProps` — the button is no longer backed by Chakra.
 *
 * The shape is nearly identical, but Chakra's style props (`px`, `bg`, `_hover`, …) are gone:
 * they came from `@chakra-ui/react`'s `ButtonProps`, which this library no longer depends on.
 * Use `className` or the `variant` / `size` / `colorPalette` props instead.
 */
export type ChakraButtonProps = BasicButtonProps;

export interface ButtonProps extends AntdButtonProps {
  hasPermi?: string[];
  hidden?: boolean;
  iconPosition?: "start" | "end";
}

interface ButtonFC
  extends React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  > {
  /** The library's own button — antd-free, styled from the design tokens */
  Basic: typeof BasicButton;
  /** @deprecated use `Button.Basic`; this is the same component, kept for source compatibility */
  Chakra: typeof BasicButton;
}

// forwardRef: when wrapped by overlay components like Tooltip / Popconfirm, the button DOM can be accessed directly,
// preventing rc libraries from falling back to findDOMNode and triggering React deprecation warnings
const InternalButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      hasPermi,
      hidden,
      iconPosition = "start",
      className,
      children,
      title,
      ...buttonConfig
    } = props;
    const { permitted } = usePermissions(hasPermi);

    if (!permitted || hidden) {
      return null;
    }

    return (
      <AntdButton
        {...buttonConfig}
        ref={ref}
        className={classNames(className, styles.button, {
          [styles[iconPosition]]: iconPosition,
        })}
        children={children ?? title}
      />
    );
  }
);

const Button = InternalButton as ButtonFC;

Button.Basic = BasicButton;
Button.Chakra = BasicButton;

export default Button;
