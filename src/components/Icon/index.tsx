import {
  Icon as Iconify,
  IconifyIcon,
  IconProps as IconifyProps,
  addCollection,
  iconLoaded,
} from "@iconify/react";
import iconCollections from "./collections.generated";

import * as AntdIcons from "@ant-design/icons";
import React, { useCallback, useEffect, useRef } from "react";
import classNames from "classnames";
import styles from "./index.module.scss";
import { useLatestRef } from "../../hooks/useLatestRef";

/**
 * 本库自己用到的 iconify 图标，在模块加载时就注册掉。
 *
 * 为什么必须由库来做：`@iconify/react` 对**没注册过**的图标名一律去
 * api.iconify.design 现拉。本库在几十处组件里写死了图标名（`ep:arrow-down`、
 * `icon-park:left`、`ci:copy`……），这些名字在消费方源码里一个字都搜不到，
 * 于是消费方既扫不到、也不会想到要注册 —— 结果就是每个消费方都在替本库向公网
 * 发请求。断网 / 内网 / CSP 收紧的环境下那些图标直接空白，**而且不报错**。
 *
 * 数据由 scripts/gen-icon-data.cjs 从源码里的图标名反扫生成，只裁用到的那几十枚
 * （整集动辄几 MB）。放在 Icon 这个模块里注册，是因为本库所有图标都从这儿出：
 * 只要有任何一个用到图标的组件被引入，注册就一定已经发生 —— 不依赖消费方引根入口，
 * 子路径按需引入同样成立。反过来，一个图标都不用的消费方也不会被这份数据拖累。
 */
iconCollections.forEach((collection) => {
  addCollection(collection);
});

/** 已经警告过的名字，同一个名字只吵一次 */
const warnedIcons = new Set<string>();

/**
 * 消费方传进来的 iconify 名字如果没注册过，开发期吼一声。
 *
 * 这个缺陷本身没有任何信号：联网时一切正常，断网时一片空白、控制台干干净净。
 * 与其等上线到内网才靠肉眼发现，不如在开发期就把它变成一条可见的警告。
 * 只在非生产构建里跑，生产环境零开销。
 */
const warnIfUnregistered = (name: string) => {
  if (process.env.NODE_ENV === "production") return;
  if (!name.includes(":") || iconLoaded(name) || warnedIcons.has(name)) return;
  warnedIcons.add(name);
  console.warn(
    `[hsu-ui] Icon "${name}" 没有注册过，@iconify/react 会去 api.iconify.design 现拉：` +
      `断网 / 内网环境下它会直接空白且不报错。请先 addCollection 注册这枚图标所在的集合。`
  );
};

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

  const onRefRef = useLatestRef(onRef);

  // 回调 prop 不进依赖数组：消费方传内联箭头时每次渲染都是新引用，effect 会跟着
  // 重跑并再调一次回调 —— 回调里 setState 就是死循环（详见 Input/TextArea 的说明）
  useEffect(() => {
    onRefRef.current?.(ref);
  }, [onRefRef, ref]);

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

  if (typeof icon === "string") warnIfUnregistered(icon);

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
