import { Button as AntdButton, ButtonProps as AntdButtonProps } from "antd";

import React, { Suspense, lazy } from "react";
import usePermissions from "../../hooks/usePermissions";
import classNames from "classnames";
import styles from "./index.module.scss";
import type { ChakraButtonProps } from "./ChakraButton";

export type { ChakraButtonProps };

/**
 * The chakra family weighs about 560 KB and serves only the Button.Chakra variant, yet it
 * lands in every consumer's initial bundle because it hangs off the base Button. Switched to
 * on-demand loading: the type goes through `import type` (erased at compile time), and the
 * chunk is only fetched at runtime once Button.Chakra is actually rendered.
 */
const InternalChakraButton = lazy(() => import("./ChakraButton"));

const ChakraButton: React.FC<ChakraButtonProps> = (props) => (
  <Suspense fallback={null}>
    <InternalChakraButton {...props} />
  </Suspense>
);

export interface ButtonProps extends AntdButtonProps {
  hasPermi?: string[];
  hidden?: boolean;
  iconPosition?: "start" | "end";
}

interface ButtonFC
  extends React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  > {
  Chakra: React.FC<ChakraButtonProps>;
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

Button.Chakra = ChakraButton;

export default Button;
