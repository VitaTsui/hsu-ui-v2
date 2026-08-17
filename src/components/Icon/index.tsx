import {
  Icon as Iconify,
  IconifyIcon,
  IconProps as IconifyProps,
} from "@iconify/react";

import * as AntdIcons from "@ant-design/icons";
import React, { useCallback, useEffect, useRef } from "react";
import classNames from "classnames";
import styles from "./index.module.scss";

type AntdNamedIconComponent = React.ForwardRefExoticComponent<
  {
    className?: string;
    style?: React.CSSProperties;
  } & React.RefAttributes<HTMLSpanElement>
>;

/** Check whether it is an AntD icon component name (e.g. "SettingOutlined") and return the corresponding component */
const getAntdIcon = (
  icon: unknown
): AntdNamedIconComponent | undefined => {
  if (typeof icon !== "string") return undefined;
  if (!/(?:Outlined|Filled|TwoTone)$/.test(icon)) return undefined;
  return (AntdIcons as unknown as Record<string, AntdNamedIconComponent | undefined>)[
    icon
  ];
};

interface IconProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLSpanElement>,
    HTMLDivElement
  > {
  iconProps?: Omit<IconifyProps, "icon">;
  icon: IconifyIcon | string;
  onRef?: (ref?: React.RefObject<HTMLDivElement>) => void;
  fontSize?: number | string;
}

/**
 * `forwardRef` 不是可选的：`Tooltip` / `Dropdown` / `Popover` 都要往触发元素上挂 ref
 * 才能定位浮层。作为普通函数组件时，把 Icon 直接塞进它们里面会让 React 报
 * “Function components cannot be given refs”，浮层的定位也失去了锚点。
 * 图标是这几个组件最常见的触发元素，所以这个坑几乎人人会踩。
 */
const Icon = React.forwardRef<HTMLSpanElement, IconProps>((props, forwardedRef) => {
  const {
    iconProps,
    icon,
    className,
    color,
    style,
    onRef,
    fontSize,
    ...iconConfig
  } = props;
  const ref = useRef<HTMLDivElement>(null);

  // 内外两个 ref 都要喂：内部这个是 `onRef` 回调的载体（老接口，不能动），
  // 外部那个是浮层组件用来定位的
  const setRef = useCallback(
    (node: HTMLSpanElement | null) => {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current =
        node as unknown as HTMLDivElement | null;

      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );

  useEffect(() => {
    onRef?.(ref);
  }, [onRef, ref]);

  const mergedStyle: React.CSSProperties = {
    color,
    fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
    ...style,
  };

  // Support AntD icon names (e.g. "SettingOutlined") by rendering the corresponding AntD icon component directly
  const AntdNamedIcon = getAntdIcon(icon);
  if (AntdNamedIcon) {
    return (
      <AntdNamedIcon
        {...iconConfig}
        className={classNames([styles.icon, className])}
        style={mergedStyle}
        ref={setRef}
      />
    );
  }

  // Iconify icons: host Iconify's own svg directly in a span, instead of nesting it inside
  // the antd Icon's svg (whose viewBox would scale the inner svg down so much the icon becomes invisible).
  return (
    <span
      {...iconConfig}
      role="img"
      ref={setRef}
      className={classNames(["anticon", styles.icon, className])}
      style={mergedStyle}
    >
      <Iconify {...iconProps} icon={icon} width="1em" height="1em" />
    </span>
  );
});

Icon.displayName = "Icon";

export default Icon;
