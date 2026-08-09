---
title: Hooks
group:
  title: 指南
  order: 1
order: 3
---

# Hooks

库里对外的几个 hook，都从包根引入：

```ts
import {
  usePermissions,
  useBreakpoint,
  usePointerType,
  useIsDark,
  useLabelWidth,
} from "@hsu-react/ui";
```

## usePermissions

按权限码判断当前用户能不能看到某个东西。数据源是 [`ConfigProvider`](/components/config-provider) 的 `permissions`。

```ts | pure
const { permitted } = usePermissions(["system:user:add"]);

if (!permitted) return null;
```

- `hasPermi` 不传或为空 → 放行
- `ConfigProvider` 没给 `permissions`（或给了 `null`）→ 放行，即「不做权限控制」
- `permissions` 给的是**空数组** → 一律不放行，即「这个用户什么都没有」

组件上的 `hasPermi` 属性（`Button`、`Tree`、`Operate`、`FormItem` 等）走的就是它，一般不用手写。

## useBreakpoint

响应式断点判断。断点值和 SCSS 的 `_responsive.scss` 同源，所以 JS 判断不会和媒体查询错开半个像素。

```ts | pure
const { current, up, down, isMobile } = useBreakpoint();
```

| 字段 | 说明 |
| --- | --- |
| current | 当前命中的最大断点；比 `sm` 还窄时是 `"xs"` |
| up | `up.md` 表示视口 ≥ md |
| down | `down.md` 表示视口 < md |
| isMobile | `< md` 的简写，用于「是不是手机」这类粗判断 |

断点：`sm 640` / `md 768` / `lg 1024` / `xl 1280` / `xxl 1536`。

## usePointerType

判断输入设备，用来区分「窄屏」和「触屏」—— 这是两件事：竖着的 iPad 是宽屏触屏，缩窄的桌面浏览器是窄屏鼠标。

```ts | pure
const { isCoarse, canHover, isTouch } = usePointerType();
```

| 字段 | 说明 |
| --- | --- |
| isCoarse | 主输入是粗指针（手指、触控笔） |
| canHover | 设备有真正的悬停能力（鼠标、触控板） |
| isTouch | 粗指针且不能悬停 —— 通常意义上的触屏设备 |

> 需要「触屏时把悬浮态换成常驻」这类样式调整时，优先用 `_responsive.scss` 里的 `hover` / `touch` mixin，别在 JS 里判断后加类名。

## useIsDark

当前是不是暗色。依次看 `html[data-theme]`，没有则跟随系统的 `prefers-color-scheme`，并实时响应变化。

```ts | pure
const isDark = useIsDark();
```

`ConfigProvider` 内部用的就是它来决定 antd 的明暗算法；应用里通常不用直接调，除非要按明暗切换一张图片这类 CSS 变量解决不了的事。

## useLabelWidth

按一组 `FormItem` 的 label 文案量出合适的标签列宽度，避免「最长的那个标签被折行」。

```ts | pure
const labelWidth = useLabelWidth(formItems, { size: 14 }, 80);
```

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| formItem | 表单项配置 | `FormItemProps[]` |
| font | 量字用的字体，默认 `{ size: 14 }` | `Font` |
| min | 最小宽度；传 `true` 用内置下限 | `boolean \| number` |
