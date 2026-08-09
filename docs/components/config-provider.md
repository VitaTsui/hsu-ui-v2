---
nav: 组件
group:
  title: 通用
  order: 1
title: ConfigProvider 全局配置
order: 0
---

# ConfigProvider 全局配置

全局配置：权限、请求实现、设计令牌与 antd 主题。放在应用最外层，**每个用到本库的项目都应该有一个**。

## 引入

```ts
import { ConfigProvider } from "@hsu-react/ui";
```

## 基本用法

```tsx | pure
import { ConfigProvider } from "@hsu-react/ui";
import { get, post, del, put } from "@/utils/request";

export default () => (
  <ConfigProvider
    permissions={userPermissions}
    request={{ get, post, del, put }}
    primaryColor="#7c3aed"
  >
    <App />
  </ConfigProvider>
);
```

## 它管的三件事

**权限。** `permissions` 是当前用户的权限码列表。传了之后，所有带 `hasPermi` 的组件（`Button`、`Tree`、`Operate`、`FormItem` 等）与 [`usePermissions`](/guide/hooks) 都按它判断。不传（或传 `null`）表示不做权限控制，一律放行。

**请求。** 本库的少数「智能组件」（如导入表单）要自己发请求，但库不绑定任何 HTTP 客户端，实现由你注入。等价于在入口调用 `configureRequest(...)`，详见 [请求层](/guide/request)。

**主题。** 这是最容易被低估的一件事：`--vita-*` CSS 变量只能覆盖本库自己画的部分，页面里直接用的 antd 组件（`Steps`、`Tabs`、`Cascader`…）它管不到。`ConfigProvider` 把**同一份**令牌喂给 antd 的 `theme.token`，所以一个没被本库包过的 `<Steps />` 也会落在同样的色板、圆角和字号上 —— 库不需要为了统一观感去包完 antd 的 70 多个组件。

顺带，它还在内部挂了 `FeedbackHolder`，让 [`message` / `notification` / `Modal.confirm`](/components/feedback) 这些命令式 API 的输出落在 React 树内，从而能跟随主题。

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| permissions | 当前用户的权限码；`null` / 不传表示不做权限控制 | `string[] \| null` | `null` |
| request | 注入 HTTP 实现，只需给用得到的方法 | `Partial<RequestImpl>` | - |
| primaryColor | 品牌色。**同时**写 `--primary-color` 变量与 antd 的 `colorPrimary` | `string` | 令牌里的默认值 |
| dark | 强制明暗，不传则跟随 `html[data-theme]` 与系统偏好 | `boolean` | - |
| theme | 额外的 antd 主题配置，叠加在生成的之上 | `ThemeConfig` | - |
| antdTheme | 设为 `false` 则完全不接管 antd 主题 | `boolean` | `true` |
| children | 子节点 | `ReactNode` | - |

## 为什么品牌色要走属性，不能只改 CSS 变量

`--vita-primary` 只影响本库自己的样式。antd 需要从主色**推导一整套 10 级色板**（悬浮、激活、边框、浅底…），这件事在 JS 里做，而 antd 读不了 `var(--primary-color)` —— 给它一个 `var()` 字符串，色板推导会直接失败。

`primaryColor` 属性同时喂两边：写 CSS 变量给本库，传字面量色值给 antd。只改其中一边，一定会看到「按钮是新色、日期选择器还是旧色」这种半截效果。

## 不想让本库管 antd 主题

```tsx | pure
<ConfigProvider antdTheme={false}>...</ConfigProvider>
```

此时本库自己的组件仍然跟随 `--vita-*` 变量，但未被包装的 antd 组件回到 antd 原生观感。适合已经有一套完整 antd 主题、只想用本库组件的项目。
