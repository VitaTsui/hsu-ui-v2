import React, { ReactNode } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";
import usePermissions from "../../../hooks/usePermissions";
import styles from "./index.module.scss";
import classNames from "classnames";
import ChakraRoot from "../../ChakraRoot";

export interface ChakraButtonProps extends ButtonProps {
  hasPermi?: string[];
  hidden?: boolean;
  iconPosition?: "start" | "end";
  icon?: ReactNode;
  reRender?: (btn: React.ReactElement) => ReactNode;
}

const ChakraButton: React.FC<ChakraButtonProps> = (props) => {
  const {
    hasPermi,
    hidden,
    iconPosition = "start",
    className,
    children,
    title,
    icon,
    reRender,
    ...buttonConfig
  } = props;
  const { permitted } = usePermissions(hasPermi);

  if (!permitted || hidden) {
    return null;
  }

  if (reRender) {
    return (
      <ChakraRoot>
        {reRender(
          <Button
            {...buttonConfig}
            className={classNames(className, styles.button, {
              [styles[iconPosition]]: iconPosition,
            })}
            children={
              <>
                {iconPosition === "start" && icon && (
                  <span className={styles.icon}>{icon}</span>
                )}
                {children ?? title}
                {iconPosition === "end" && icon && (
                  <span className={styles.icon}>{icon}</span>
                )}
              </>
            }
          />,
        )}
      </ChakraRoot>
    );
  }

  return (
    <ChakraRoot>
      <Button
        {...buttonConfig}
        className={classNames(className, styles.button, {
          [styles[iconPosition]]: iconPosition,
        })}
        children={
          <>
            {iconPosition === "start" && icon && (
              <span className={styles.icon}>{icon}</span>
            )}
            {children ?? title}
            {iconPosition === "end" && icon && (
              <span className={styles.icon}>{icon}</span>
            )}
          </>
        }
      />
    </ChakraRoot>
  );
};

export default ChakraButton;
