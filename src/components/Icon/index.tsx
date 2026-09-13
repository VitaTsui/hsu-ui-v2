import {
  Icon as Iconify,
  IconifyIcon,
  IconProps as IconifyProps,
  addCollection,
  iconLoaded,
} from "@iconify/react";
import iconCollections from "./collections.generated";

import React, { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./index.module.scss";
import { useLatestRef } from "../../hooks/useLatestRef";

/**
 * 本库自己用到的 iconify 图标，在模块加载时就注册掉。
 *
 * 为什么必须由库来做：`@iconify/react` 对**没注册过**的图标名一律去
 * api.iconify.design 现拉。本库在几十处组件里写死了图标名（`ep:arrow-down`、
 * `icon-park:left`、`ci:copy`、`ant-design:form-outlined`……），这些名字在消费方源码里一个字都搜不到，
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

type AntdIconsModule = Record<string, AntdNamedIconComponent | undefined>;

/**
 * `@ant-design/icons` 改成**按需异步加载**，不再 `import * as`。
 *
 * 为什么非改不可：本组件支持消费方传 antd 图标名（`<Icon icon="UserOutlined" />`），
 * 名字是运行时才知道的字符串，所以实现上只能 `AntdIcons[name]` 这样按下标取。
 * 而 `import * as X` ＋ 动态下标取值，**打包器无法摇树** —— 它没法证明哪些导出用不上，
 * 只能全留。实测（Vite 8 / rolldown，消费方同一套构建）：这么写一个入口就是
 * **1049 KB raw / 198 KB gzip**（全部 847 枚 antd 图标），而只具名引一枚是 8 KB / 3 KB。
 * 也就是说，**每个消费方都在为这条分发逻辑背将近 200 KB gzip**，哪怕它一个 antd 名字都没传过。
 *
 * 改成固定字符串的 `import()` 之后（固定字符串，不是变量路径，打包器静态分析得了），
 * 这 198 KB 变成一个**独立 chunk**，只有真的传了 antd 名字才会去下载；
 * 入口只剩 749 bytes gzip。公开 API 一个字没动：还是传字符串名、还是那 847 个名字都认。
 *
 * 代价：首次渲染某个 antd 名字的图标时，模块要等一个来回才到，那一帧图标是空的。
 * 用等宽等高的占位撑住，不产生布局抖动；模块只加载一次，之后同步命中。
 * 服务端渲染场景下这一枚不会出现在首屏 HTML 里 —— 本库是纯客户端的中后台组件库，
 * 但用到 SSR 的话要知道这一条。
 */
let antdIconsModule: AntdIconsModule | null = null;
let antdIconsPromise: Promise<AntdIconsModule> | null = null;

const loadAntdIcons = () => {
  if (!antdIconsPromise) {
    antdIconsPromise = import("@ant-design/icons").then((mod) => {
      antdIconsModule = mod as unknown as AntdIconsModule;
      return antdIconsModule;
    });
  }
  return antdIconsPromise;
};

/** 是不是 antd 图标名（`SettingOutlined` 这种驼峰名） */
const isAntdIconName = (icon: unknown): icon is string =>
  typeof icon === "string" && /(?:Outlined|Filled|TwoTone)$/.test(icon);

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

  // antd 图标名走异步加载：模块没到就先占位，到了再重渲染换成真图标。
  // hook 必须无条件调用，所以判断放在 effect 里，不放在提前 return 上面
  const wantsAntdIcon = isAntdIconName(icon);
  const [, bumpAntdIcons] = useState(0);
  useEffect(() => {
    if (!wantsAntdIcon || antdIconsModule) return;
    let alive = true;
    loadAntdIcons().then(() => {
      if (alive) bumpAntdIcons((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [wantsAntdIcon]);

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
  const AntdNamedIcon = wantsAntdIcon
    ? antdIconsModule?.[icon as string]
    : undefined;

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

  // antd 图标模块还在路上：占一个等宽等高的位置，等它到了再换成真图标。
  // 不占位的话这一帧宽度是 0，图标到位时整行会横向抖一下。
  // （模块已加载、但这个名字在 antd 里根本不存在 —— 那就往下走 iconify 那条，与改动前一致）
  if (wantsAntdIcon && !antdIconsModule) {
    return (
      <span
        {...iconConfig}
        role="img"
        aria-hidden
        ref={setRef}
        className={classNames(["anticon", styles.icon, className])}
        style={{ display: "inline-block", width: "1em", height: "1em", ...mergedStyle }}
      />
    );
  }

  if (typeof icon === "string" && !wantsAntdIcon) warnIfUnregistered(icon);

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
