import {
  Icon as Iconify,
  IconifyIcon,
  IconProps as IconifyProps,
} from "@iconify/react/offline";
import { addIconCollection, isIconRegistered } from "./registry";
import iconCollections from "./collections.generated";
import type {
  AntdIconLoader,
  AntdNamedIconComponent,
} from "./antdIcons.generated";

import React, { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./index.module.scss";
import { useLatestRef } from "../../hooks/useLatestRef";

/**
 * 本库自己用到的 iconify 图标，在模块加载时就注册掉。
 *
 * 为什么必须由库来做：本库在几十处组件里写死了图标名（`ep:arrow-down`、
 * `icon-park:left`、`ci:copy`、`ant-design:form-outlined`……），这些名字在消费方源码里一个字都搜不到，
 * 于是消费方既扫不到、也不会想到要注册 —— 不自带这份数据，本库自己的图标就全是空位。
 *
 * 数据由 scripts/gen-icon-data.cjs 从源码里的图标名反扫生成，只裁用到的那几十枚
 * （整集动辄几 MB）。放在 Icon 这个模块里注册，是因为本库所有图标都从这儿出：
 * 只要有任何一个用到图标的组件被引入，注册就一定已经发生 —— 不依赖消费方引根入口，
 * 子路径按需引入同样成立。反过来，一个图标都不用的消费方也不会被这份数据拖累。
 */
iconCollections.forEach((collection) => {
  addIconCollection(collection);
});

/** 已经警告过的名字，同一个名字只吵一次 */
const warnedIcons = new Set<string>();

/**
 * 消费方传进来的 iconify 名字如果没注册过，开发期吼一声。
 *
 * 渲染走的是 `@iconify/react/offline`：**没注册过的名字就是画不出来**，
 * 一个空位、控制台干干净净、连一次失败的请求都没有。没有任何信号的缺陷
 * 只能靠机器提醒，所以开发期把它变成一条可见的警告。生产构建里整段不执行。
 */
const warnIfUnregistered = (name: string) => {
  if (process.env.NODE_ENV === "production") return;
  if (!name.includes(":") || isIconRegistered(name) || warnedIcons.has(name))
    return;
  warnedIcons.add(name);
  console.warn(
    `[hsu-ui] Icon "${name}" 没有注册过，画不出来（会是一个空位且不报错）。` +
      `请先用 \`addIconCollection\`（从 @hsu-react/ui 导出）注册这枚图标所在的集合。` +
      `注意不要用 @iconify/react 自带的 addCollection —— 联网版与 offline 版各有一份` +
      `互不相通的注册表，注册到联网版那一份等于没注册。`
  );
};

/**
 * antd 图标名走**逐枚**懒加载：一枚一个 chunk，只下载真被传到的那一枚。
 *
 * 为什么不能从 `@ant-design/icons` 包根取：本组件支持消费方传 antd 图标名
 * （`<Icon icon="UserOutlined" />`），名字是运行时才知道的字符串，所以只能按下标取。
 * 历史上试过两种写法，**两种都让每个消费方白背约 200 KB gzip**：
 *
 * - `import * as AntdIcons`（2.5.10 及之前）：命名空间 ＋ 动态下标，打包器无法摇树，
 *   846 枚全进首屏（实测 1049 KB raw / 198 KB gzip）。
 * - `import("@ant-design/icons")`（2.5.11）：看着是「按需」了，首屏 HTML 里确实没有它，
 *   **但整页流量一个字节没省**。`import()` 要的是整个包根的命名空间，打包器必须把
 *   `es/index.js` 连同 846 枚保留成一个 chunk；而这个包根**同时被静态引用**着 ——
 *   本库依赖的 `@ant-design/x` 就有 27 处 `import { XxxOutlined } from "@ant-design/icons"`。
 *   静态与动态落在同一个模块上，那 1 MB 的 chunk 就成了**静态依赖**：谁引到 Chat/Sender
 *   谁就下载它，跟有没有传过 antd 图标名毫无关系。实测（消费方 agent-monitor-web，
 *   Vite 8 / rolldown）portal 加载完之后仍有一次 203 KB 的下载；把这句 `import()` 拿掉
 *   重新构建，那个 1,018,635 字节的 chunk 整个消失。
 *
 * 所以按需必须落到**单枚**这一级：`antdIcons.generated.ts` 里每枚一句固定字符串的
 * `import()`（固定字符串，不是变量路径，打包器静态分析得了），打包器为每枚各切一个
 * 几百字节的 chunk。那张表自身也藏在一次 `import()` 后面 —— 一个 antd 名字都不传的
 * 消费方**零字节、零请求**。公开 API 一个字没动：还是传字符串名、还是这 846 个名字都认。
 *
 * 代价：首次渲染某个 antd 名字的图标时，要等一个来回才到，那一帧图标是空的。
 * 用等宽等高的占位撑住，不产生布局抖动；每枚只加载一次，之后同步命中。
 * 服务端渲染场景下这一枚不会出现在首屏 HTML 里 —— 本库是纯客户端的中后台组件库，
 * 但用到 SSR 的话要知道这一条。
 */
let antdIconLoadersPromise: Promise<
  Record<string, AntdIconLoader | undefined>
> | null = null;

/** 已经取到的 antd 图标组件 */
const antdIconComponents = new Map<string, AntdNamedIconComponent>();

/**
 * 已经**问过结果**的名字（无论取到没取到）。
 *
 * 「没取到」也要记：像 `FooOutlined` 这种符合命名规律、但 antd 里根本不存在的名字，
 * 记下来才能让它立刻回落到 iconify 那条路，而不是永远停在占位上。
 */
const antdIconResolved = new Set<string>();

const loadAntdIcon = async (name: string) => {
  if (!antdIconLoadersPromise) {
    antdIconLoadersPromise = import("./antdIcons.generated").then(
      (mod) => mod.default
    );
  }
  const loaders = await antdIconLoadersPromise;
  const loader = loaders[name];
  if (loader) {
    antdIconComponents.set(name, (await loader()).default);
  }
  antdIconResolved.add(name);
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

  // antd 图标名走异步加载：那一枚没到就先占位，到了再重渲染换成真图标。
  // hook 必须无条件调用，所以判断放在 effect 里，不放在提前 return 上面
  const wantsAntdIcon = isAntdIconName(icon);
  // 逐枚加载，所以这里要拿**具体名字**当依赖：同一个 Icon 换个 antd 名字也得重新取
  const antdIconName = wantsAntdIcon ? icon : undefined;
  const [, bumpAntdIcons] = useState(0);
  useEffect(() => {
    if (!antdIconName || antdIconResolved.has(antdIconName)) return;
    let alive = true;
    loadAntdIcon(antdIconName).then(() => {
      if (alive) bumpAntdIcons((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [antdIconName]);

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
  const AntdNamedIcon = antdIconName
    ? antdIconComponents.get(antdIconName)
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

  // 这一枚 antd 图标还在路上：占一个等宽等高的位置，等它到了再换成真图标。
  // 不占位的话这一帧宽度是 0，图标到位时整行会横向抖一下。
  // （问过了、antd 里根本没这个名字 —— 那就往下走 iconify 那条，与改动前一致）
  if (antdIconName && !antdIconResolved.has(antdIconName)) {
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

/**
 * 图标注册入口。消费方要用本库没带的图标集时，从这里注册 ——
 * **不要**用 `@iconify/react` 自带的 `addCollection`，见 registry.ts 的说明。
 */
export { addIconCollection, isIconRegistered } from "./registry";
/** 图标集的数据形状。透出来是为了让消费方不必自己去依赖 `@iconify/react` */
export type { IconifyJSON } from "@iconify/react/offline";

export default Icon;
