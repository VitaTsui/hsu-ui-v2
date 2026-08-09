---
title: Theme 外观
order: 5
---

# Theme 外观

外观三态（浅色 / 深色 / 跟随系统）与导航区专属配色。

## 引入

```ts
import Layout from "@hsu-react/ui/es/layout";

<Layout.Theme>{children}</Layout.Theme>;
```

## 与 ConfigProvider 的分工

这两个组件**不是二选一，也不重复**：

- [`ConfigProvider`](/components/config-provider) 提供**全局主题** —— 色板、圆角、字号、控件高度、明暗算法、focus ring，全部从设计令牌产出
- `Layout.Theme` 只做两件它独有的事：
  1. 写 `html[data-theme]`。令牌的 CSS 变量与 `useIsDark` 都监听这个属性，但没有别的地方写它 —— 外观三态就落在这儿
  2. 叠加导航区配色。菜单选中态的胶囊、深色侧栏的渐变，这些是布局特有的，通用令牌覆盖不到。选中态的颜色取**当前生效的主色**（antd `useToken` 读到的 `colorPrimary`），所以在 `ConfigProvider` 上换 `primaryColor`，菜单会跟着换

所以顺序是 `ConfigProvider` 在外、`Layout.Theme` 在内（antd 的嵌套主题规则是内层胜）。

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| children | 子节点 | `ReactNode` | - |
| navDarkColors | 深色导航渐变的两端色 | `{ top: string; bottom: string }` | `{ top: "#1f1f1f", bottom: "#141414" }` |

## ThemeStore

外观状态是一个 mobx store，应用侧可直接读写（`Layout.Header` 的外观切换器用的就是它）：

```ts | pure
import Layout from "@hsu-react/ui/es/layout";

Layout.ThemeStore.appearance;              // "light" | "dark" | "system"
Layout.ThemeStore.isDark;                  // 解析 system 之后的实际明暗
Layout.ThemeStore.setAppearance("dark");   // 切换，并写入 localStorage
```

`appearance` 持久化在 `localStorage["hsu-ui:appearance"]`；选了 `system` 时会跟随 `prefers-color-scheme` 实时变化。
