---
nav: 组件
group:
  title: 通用
  order: 1
title: Button 按钮
---

# Button 按钮

在 antd `Button` 之上增加 `hasPermi`（权限码）、`hidden`、`iconPosition` 等能力。无权限或 `hidden` 时不渲染。

## 引入

```ts
import { Button } from "@hsu-react/ui";
```

## 按钮

```tsx
import React from "react";
import { Button } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
    <Button type="primary">主要按钮</Button>
    <Button>默认按钮</Button>
    <Button type="dashed">虚线按钮</Button>
    <Button danger>危险按钮</Button>
    <Button type="primary" disabled>
      禁用
    </Button>
  </div>
);
```

## 按钮形态

`variant` 与 `color` 直接用 antd v6 的原生能力：6 种形态 × 16 个预设色。

> **2.0 破坏性变更**：`Button.Chakra`（后改名 `Button.Basic`）这个子组件**已删除**。
>
> 它当初存在是因为 antd v5 的 Button 只有 `type`，表达不了 outline / subtle / ghost 这些形态，于是引了 Chakra UI 来补。antd v6 原生加了 `color` + `variant`，正好就是它存在的理由，所以整个删掉、`Button` 重新成为唯一的按钮，chakra 全家（约 560 KB）也一并移除。
>
> 旧属性对照：
>
> | 旧写法 | 新写法 |
> | --- | --- |
> | `variant="solid"` | `variant="solid"` |
> | `variant="outline"` | `variant="outlined"` |
> | `variant="surface"` | `variant="surface"`（保留，见下） |
> | `variant="subtle"` | `variant="filled"` |
> | `variant="ghost"` | `variant="text"` |
> | `variant="plain"` | `variant="link"` |
> | `colorPalette="gray"` | `color="default"` |
> | `colorPalette="blue"` 等 | `color="blue"` 等 |
> | `size="xs" \| "sm" \| "md" \| "lg"` | `size="small" \| "small" \| "middle" \| "large"` |
>
> Chakra 的样式属性（`px`、`bg`、`_hover` 等）不再支持，请改用 `className`。

```tsx
import React from "react";
import { Button } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Button color="primary" variant="solid">实心</Button>
    <Button variant="surface">浅底边框</Button>
    <Button variant="outlined">描边</Button>
    <Button variant="filled">浅底</Button>
    <Button variant="text">文字</Button>
    <Button variant="link">链接</Button>
    <Button variant="dashed">虚线</Button>
  </div>
);
```

### surface：浅底 + 边框

这是本库在 antd 之上唯一扩展的形态，也正是当初引入 Chakra 按钮要补的那个样式 —— antd 没有它：`filled` 有底色但把边框显式设成了透明，`outlined` 有边框但没底色。

实现上它走 antd 的 `filled`（底色、文字色、hover / active / disabled 全都照旧由 antd 那条色阶算），只把边框变量按同一条色阶调回来。因为改的是 antd 自己的 CSS 变量而不是写死颜色，**16 个预设色与明暗主题都自动跟着走**。

```tsx
import React from "react";
import { Button } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Button variant="surface">默认</Button>
    <Button variant="surface" color="primary">主色</Button>
    <Button variant="surface" color="danger">危险</Button>
    <Button variant="surface" color="green">绿</Button>
    <Button variant="surface" color="purple">紫</Button>
    <Button variant="surface" disabled>禁用</Button>
  </div>
);
```

## API

在 [antd ButtonProps](https://ant.design/components/button-cn) 基础上扩展：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| hasPermi | 权限码；当前用户不具备时按钮不渲染（配合 `ConfigProvider.permissions`） | `string[]` | - |
| hidden | 是否隐藏（不渲染） | `boolean` | `false` |
| iconPosition | 图标位置。antd v6 起这个属性改名为 `iconPlacement`，两个名字这里都接受，内部统一翻成 `iconPlacement`，不会触发 antd 的弃用告警 | `'start' \| 'end'` | `'start'` |
| variant | 形态；比 antd 多一个 `surface`（浅底 + 边框） | `'solid' \| 'outlined' \| 'dashed' \| 'filled' \| 'text' \| 'link' \| 'surface'` | - |
| reRender | 包裹渲染结果，便于套 Tooltip / Popconfirm | `(btn: ReactElement) => ReactNode` | - |

> `variant` / `color` / `size` / `shape` 等其余属性与 [antd Button](https://ant.design/components/button-cn) 一致，`variant` 额外多一个 `surface`。
