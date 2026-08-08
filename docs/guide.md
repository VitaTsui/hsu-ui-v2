---
title: 快速上手
group:
  title: 指南
  order: 1
order: 1
---

# 快速上手

Hsu UI 是一套基于 React + Ant Design 的中后台业务组件库，把「列表 + 搜索 + 表单弹窗 + CRUD」这类重复劳动沉淀为页面级组件。

## 安装

```bash
yarn add @hsu-react/ui
```

同时确保宿主项目已安装 peerDependencies：

```bash
yarn add react react-dom antd@^6 @ant-design/icons@^6 mobx mobx-react-lite
```

## 从 0.0.x 升级到 0.1.0

0.1.0 有三处破坏性变更，都需要宿主项目配合。

### 1. antd 必须同时升到 v6

peerDependencies 收紧为 `antd >=6` / `@ant-design/icons >=6`。**antd 5 与 6 无法同时兼容**，本库与宿主项目要同一批次升级。antd 官方迁移文档见 [v5 to v6](https://ant.design/docs/react/migration-v6-cn)。

对宿主项目的直接影响：

- `@ant-design/icons` 必须一并升到 v6（v6 与 antd 5 不兼容）
- 如果你的项目里写过针对 antd 内部类名的样式覆盖，v6 重构了 **Select / Checkbox / Radio** 的 DOM，这些需要重写：

  | v5 | v6 |
  | --- | --- |
  | `.ant-select-selector`（子节点承载边框/背景/内边距） | 移到 `.ant-select` 根节点，布局改为 flex |
  | `.ant-select-selection-wrap` / `-selection-search` | 合并为 `.ant-select-content` > `input.ant-select-input` |
  | `.ant-select-selection-item`（单选值） | 单选进 `.ant-select-content`；该类名仅在多选下作为 tag 保留 |
  | `.ant-select-selection-placeholder` | `.ant-select-placeholder` |
  | `.ant-select-arrow` | `.ant-select-suffix`（在 flex 流内，不再绝对定位） |
  | `.ant-checkbox-inner` / `.ant-radio-inner` | 方框直接画在 `.ant-checkbox` / `.ant-radio` 上 |
  | `.ant-tabs-tabpane` | `.ant-tabs-tabpanel` |
  | `.ant-tabs-content-holder` | 已移除，`.ant-tabs-content` 直接接管 |

- 若用 Tooltip / Popover / Dropdown 包裹自定义组件：v6 的 Trigger 直接给子节点传 ref（v5 有 `findDOMNode` 兜底），普通函数组件会告警且接不到 Trigger 注入的事件，需要改成 `forwardRef`

本库自身的公开 props 名**未改**（`popupClassName`、`onDropdownVisibleChange`、`destroyOnClose` 等仍可用，内部已转发到 v6 的新 API）。

### 2. Chakra UI 已移除

`@chakra-ui/react` 与 `@emotion/*` 不再是依赖。

- `Button.Chakra` → `Button.Basic`，`ChakraButtonProps` → `BasicButtonProps`。旧名保留为**已废弃别名**，源码可以先不改
- **但 chakra 的样式属性（`px`、`bg`、`_hover` 等）不再支持** —— 它们来自 `@chakra-ui/react` 的 `ButtonProps`。升级前请在项目里搜一遍 `beforeButtonGroup` / `affterButtonGroup` / `buttonGroup` 的配置项，把这类属性换成 `className` 或 `variant` / `size` / `colorPalette`
- 导出的 `ChakraRoot` 已删除；应用入口若还挂着 `ChakraProvider` / `CacheProvider`，可以一并去掉

### 3. 设计变量改名，且 ConfigProvider 开始接管 antd 主题

- CSS 变量 `--cf-*` 改为语义化的 `--vita-*`（见下方「设计令牌与主题」）。旧名**全部保留为兼容别名**，既有覆盖不会失效
- `ConfigProvider` 现在默认会把令牌喂给 antd 的 `theme.token`。若你的应用入口已经自己包了一层 antd `ConfigProvider` 做主题，两者会按 antd 的规则就近合并（内层胜）；不希望本库插手就传 `antdTheme={false}`
- 换品牌色请改用 `<ConfigProvider primaryColor="...">`，它会同时设置 CSS 变量与 antd 的 `colorPrimary`；只覆盖 `--primary-color` 的老写法仍然有效，但**只影响 CSS 侧**，antd 组件不会跟着变
- 观感整体向 shadcn/ui 靠拢：中性色改为 zinc 色阶、圆角基准从 6px 调到 8px、阴影收薄。页面里若有依赖旧视觉的像素级微调，需要复核

## 注入请求与权限

库内的「智能组件」（如 `ImportForm` 的下载模板）不绑定具体 HTTP 客户端，需要通过 `ConfigProvider` 注入：

```tsx | pure
import { ConfigProvider } from "@hsu-react/ui";
import { get, post, del, put } from "@/services/Axios";

<ConfigProvider
  permissions={userPermissions}      // 当前用户权限码，驱动 hasPermi 校验
  request={{ get, post, del, put }}   // 注入请求实现
>
  <App />
</ConfigProvider>;
```

- `permissions`：传入后，所有带 `hasPermi` 的按钮/表单/操作会据此显隐；不传默认全部放行。
- `request`：注入后，依赖请求的组件即可工作；也可在入口直接调用 `configureRequest({ get, post, del, put })`。

## 设计令牌与主题

观感参照 [shadcn/ui](https://ui.shadcn.com/) 的中性色阶（zinc）、圆角与 focus ring，品牌色保持可配。

### 一份真源，两个下游

`src/styles/tokens.json` 是唯一真源，往下产出两样东西：

| 产物 | 覆盖范围 |
| --- | --- |
| `--vita-*` CSS 变量（`es/styles/tokens.scss`，由脚本生成） | 本库自己画的一切，随明暗实时切换 |
| antd 的 `theme.token`（`toAntdTheme()`，由 `ConfigProvider` 注入） | 本库**没有**封装、你直接使用的 antd 组件 |

第二条是关键：`--vita-*` 覆盖不到你页面里直接写的 `<Steps />`。把同一份令牌喂给 antd，未封装的组件才会和封装过的落在同一套色板、圆角与字号上 —— 这样不封装全部 75 个 antd 组件也能保持观感统一。

> 为什么不能只用 CSS 变量：antd 要把 `colorPrimary` 经 `@ant-design/colors` 派生出 10 级色板，必须拿到真实颜色值。传 `var(--vita-primary)` 会让派生出的整组色崩掉。

### 换品牌色

```tsx | pure
<ConfigProvider primaryColor="#7c3aed">
  <App />
</ConfigProvider>
```

这一个属性会同时设置 CSS 变量与 antd 的 `colorPrimary`。**不要只覆盖 CSS 变量** —— 那样 antd 组件不会跟着变。

（`--primary-color` 仍然有效：`--vita-primary` 反过来引用它，所以 0.0.x 时期的覆盖写法不会失效，只是同样只影响 CSS 侧。）

### 明暗

CSS 变量自己监听 `html[data-theme="dark"]`；antd 的令牌是 JS 算的，由 `ConfigProvider` 通过 `useIsDark` 观察同一批属性后切 `darkAlgorithm`。应用侧只需翻转那个属性，两边一起走。想强制某一侧，用 `dark={true | false}`。

### 常用变量

```
--vita-primary / --vita-primary-foreground
--vita-background   页面画布      --vita-surface     卡片 / 面板
--vita-muted        次级背景      --vita-hover       行 / 项 hover
--vita-border       边框          --vita-border-weak 更浅的分隔线
--vita-foreground   主文字        --vita-muted-foreground / --vita-subtle-foreground
--vita-success / --vita-warning / --vita-error
--vita-radius-xs|sm|base|lg       --vita-shadow-1|2|3
--vita-focus-ring / --vita-focus-ring-error
```

> 0.1.0 之前这套变量叫 `--cf-*`，全部保留为指向新名的兼容别名，既有覆盖不会失效。

### 不想让本库管 antd 主题

```tsx | pure
<ConfigProvider antdTheme={false}>...</ConfigProvider>
```

此时封装过的组件仍跟随 `--vita-*`，未封装的 antd 组件回到 antd 原生观感。也可以用 `theme` 属性在生成的配置之上再叠加自己的 token。

## 引入全局样式（可选）

库附带了对 antd 的全局观感覆盖，按需在入口引入（产物为 scss，宿主项目需安装 `sass` 并具备 scss 编译能力）：

```ts
import "@hsu-react/ui/es/styles/antd-overload.scss";
import "@hsu-react/ui/es/styles/utils.scss";
```

> `antd-overload.scss` 内部已 `@use` 令牌文件，引入它就带上了整套 `--vita-*`。若只想要变量、不想要观感覆盖，单独引 `@hsu-react/ui/es/styles/tokens.scss` 即可。

## 按需引入

组件库为 bundless 产物（`es/` 为 ESM、`lib/` 为 CJS），支持按目录按需引入：

```ts
import { Button, Panel, FormItem } from "@hsu-react/ui";
```
