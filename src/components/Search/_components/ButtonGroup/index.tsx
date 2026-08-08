import React from "react";
import Button, { ButtonProps as HsuButtonProps } from "../../../Button";
import { ReactNode } from "react";
import styles from "../../index.module.scss";

interface GroupButtonProps extends Omit<
  HsuButtonProps,
  "children" | "title"
> {
  title?: ReactNode;
}

interface ButtonGroupProps {
  beforeButtonGroup?: GroupButtonProps[];
  affterButtonGroup?: GroupButtonProps[];
  expandButton?: ReactNode;
  children?: ReactNode;
  permitted?: boolean;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (props, ref) => {
    const {
      beforeButtonGroup,
      affterButtonGroup,
      children,
      expandButton,
      permitted = true,
    } = props;

    // Determine whether there are search items (children exists and is not empty)
    const hasSearchItems = permitted && children;

    return (
      <div
        className={`${styles.buttonGroup} ${!hasSearchItems ? styles.flexStart : ""}`}
        ref={ref}
      >
        {beforeButtonGroup?.map((button, idx) => {
          const { title, ...buttonProps } = button;
          return (
            <Button key={idx} variant="surface" {...buttonProps}>
              {title}
            </Button>
          );
        })}
        {permitted && children}
        {affterButtonGroup?.map((button, idx) => {
          const { title, ...buttonProps } = button;
          return (
            <Button key={idx} variant="surface" {...buttonProps}>
              {title}
            </Button>
          );
        })}
        {permitted && expandButton}
      </div>
    );
  },
);

ButtonGroup.displayName = "ButtonGroup";
