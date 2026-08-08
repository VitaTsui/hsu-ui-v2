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

## 基础按钮

`Button.Basic` 是本库自研的按钮，不经过 antd，样式直接由设计变量（`--vita-*`）驱动，因此跟随主题明暗切换。工具栏、搜索栏的按钮组用的就是它。

> **0.1.0 破坏性变更**：它此前叫 `Button.Chakra`，底层是 Chakra UI。chakra 全家（`@chakra-ui/react` + `@emotion/*` + zag-js，约 560 KB）只服务这一个组件，已整体移除。
>
> - `Button.Chakra` 与 `ChakraButtonProps` 保留为**已废弃的别名**，源码可以不改先跑起来
> - 但 Chakra 的样式属性（`px`、`bg`、`_hover` 等）**不再支持** —— 它们来自 `@chakra-ui/react` 的 `ButtonProps`。请改用 `className` 或 `variant` / `size` / `colorPalette`
> - 库导出的 `ChakraRoot` 已删除；入口若还挂着 `ChakraProvider` / `CacheProvider`，可以一并去掉

```tsx
import React from "react";
import { Button } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Button.Basic colorPalette="blue">主要按钮</Button.Basic>
    <Button.Basic variant="outline">描边按钮</Button.Basic>
    <Button.Basic variant="surface">浅色描边</Button.Basic>
    <Button.Basic variant="subtle" colorPalette="blue">弱强调</Button.Basic>
    <Button.Basic variant="ghost">幽灵</Button.Basic>
    <Button.Basic colorPalette="red">危险</Button.Basic>
    <Button.Basic disabled>禁用</Button.Basic>
  </div>
);
```

```tsx
import React from "react";
import { Button } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Button.Basic size="xs">超小</Button.Basic>
    <Button.Basic size="sm">小</Button.Basic>
    <Button.Basic size="md">中（默认）</Button.Basic>
    <Button.Basic size="lg">大</Button.Basic>
  </div>
);
```

## API

在 [antd ButtonProps](https://ant.design/components/button-cn) 基础上扩展：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| hasPermi | 权限码；当前用户不具备时按钮不渲染（配合 `ConfigProvider.permissions`） | `string[]` | - |
| hidden | 是否隐藏（不渲染） | `boolean` | `false` |
| iconPosition | 图标位置 | `'start' \| 'end'` | `'start'` |

### Button.Basic

不基于 antd，属性继承原生 `<button>`：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| variant | 视觉形态 | `'solid' \| 'subtle' \| 'surface' \| 'outline' \| 'ghost' \| 'plain'` | `'solid'` |
| size | 尺寸（高度 24 / 28 / 32 / 40） | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` |
| colorPalette | 语义色；`gray` 跟随 `--vita-foreground`，自动适配明暗 | `'gray' \| 'blue' \| 'red' \| 'green' \| 'orange'` | `'gray'` |
| hasPermi | 权限码；当前用户不具备时按钮不渲染 | `string[]` | - |
| hidden | 是否隐藏（不渲染） | `boolean` | `false` |
| icon | 图标 | `ReactNode` | - |
| iconPosition | 图标位置 | `'start' \| 'end'` | `'start'` |
| title | `children` 为空时作为按钮文案 | `ReactNode` | - |
| reRender | 包裹渲染结果，便于套 Tooltip / Popconfirm | `(btn: ReactElement) => ReactNode` | - |
