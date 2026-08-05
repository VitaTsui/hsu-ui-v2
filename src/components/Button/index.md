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

## Chakra 按钮

基于 Chakra UI 的按钮，支持 `hasPermi`、`hidden`、`iconPosition`、`icon` 等扩展属性。

Chakra 的 system 与 emotion cache 由组件**自带**（内部包了一层 `ChakraRoot`），消费方**不需要**在应用入口挂全局 `ChakraProvider` / `CacheProvider`。这样 `@chakra-ui/react` + `@emotion/*` + zag-js（合计约 570 KB）只存在于 `Button.Chakra` 的异步 chunk 里，不进首屏。

> 从 `0.0.23` 起：入口若仍留着全局 Provider，不会出错，但那 570 KB 会照旧留在首屏——要拿到收益需把它删掉。若页面要**直接**使用 chakra 组件（不经 `Button.Chakra`），用库导出的 `ChakraRoot` 自行包一层即可。

```tsx
import React from "react";
import { Button } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Button.Chakra colorPalette="blue">主要按钮</Button.Chakra>
    <Button.Chakra variant="outline">描边按钮</Button.Chakra>
    <Button.Chakra disabled>禁用</Button.Chakra>
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

> 另提供 `Button.Chakra`，用于需要 Chakra UI 按钮样式的场景。
