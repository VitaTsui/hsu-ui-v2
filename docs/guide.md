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
pnpm add @hsu-react/ui
```

同时确保宿主项目已安装 peerDependencies：

```bash
pnpm add react react-dom antd@^6 @ant-design/icons@^6 mobx mobx-react-lite
```

### 两条版本线

| 版本线 | 依赖 | 说明 |
| --- | --- | --- |
| **2.x** | antd v6 | 当前线。`npm i @hsu-react/ui` 默认装到这条 |
| **1.x** | antd v5 | 维持 antd v5 的项目留在这条：`npm i @hsu-react/ui@1` |

1.x 与 2.x 的差异见下面的[升级说明](#从-1x-升级到-20)。两条线的 API 大体一致，2.0 的破坏性变更集中在 antd 大版本、Chakra 移除与设计变量改名这三处。

## 浏览器支持

**Chrome / Edge ≥ 111、Safari ≥ 16.4、Firefox ≥ 121**，即 2023 年底之后的版本。与 [antd v6 的口径](https://ant.design/docs/react/introduce-cn#%E7%8E%AF%E5%A2%83%E6%94%AF%E6%8C%81)（现代浏览器 / last 2 versions）一致，不支持 IE。

低于这个范围**不会白屏**——产物是 ES5 语法，运行时用到的最"新"的 API 是 `ResizeObserver`（Chrome 64 / Safari 13.1 / Firefox 69）。会出问题的是样式，而且是「整条声明作废」式的消失，不是回退到别的值：

| 特性 | 谁在用 | Chrome/Edge | Safari | Firefox | 不支持时 |
| --- | --- | --- | --- | --- | --- |
| `color-mix()` | 令牌层的 focus ring、表格选中行、树选中项、上传拖拽区等 | 111 | 16.2 | 113 | 焦点环与这些浅底色**消失** |
| `:has()` | antd v6 自身（输入框焦点环、Card、Tree 拖放指示器…）与本库若干处 | 105 | 15.4 | 121 | 相关的焦点环 / 间距不生效 |
| `@container style()` | antd v6 的 Descriptions | 111 | 18 | 尚不支持 | 该组件的自适应宽度退化 |
| `overflow: clip` | Slider 等 | 90 | 16 | 81 | 溢出内容裁切位置不对 |

`:has()` 的下限由 antd v6 决定，本库降不下去；`color-mix()` 则是本库自己的令牌层引入的（1.x 没有用到）。

> 本库仍导出 `supportsHasSelector` / `isLegacyHasSelectorBrowser` 两个运行时探测函数，早期用来给不支持 `:has()` 的浏览器兜底。**antd v6 之后它们已经买不到兼容性**——底下的 antd 组件同样在用 `:has()` 且没有降级。保留导出只为兼容既有调用方，新代码不必再用。

如果项目必须支持更老的浏览器（Firefox 115 ESR、Safari 15 之类），只能停留在 1.x + antd v5。

## 从 1.x 升级到 2.0

2.0.0 有三处破坏性变更，都需要宿主项目配合。

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

- CSS 变量 `--cf-*` 改为语义化的 `--vita-*`（见下方「设计令牌与主题」）。2.0～2.2 期间旧名保留为兼容别名，**2.3.0 起已移除**：升级前请全局搜一遍 `--cf-`，逐个换成对应的 `--vita-*`（映射表见下方「设计令牌与主题」）
- JS 侧 `lightTokens` / `darkTokens` 的**字段名**也一并改了（`canvas` → `background`、`text` → `foreground` 等）。旧字段同样保留，但标记为 deprecated，建议改用新名。其中 `headerBg` 在新命名里没有对应项，别名指向 `surface`（2.0 之前两者取值本就一致）
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

（`--primary-color` 仍然有效：`--vita-primary` 反过来引用它，所以 1.x 时期的覆盖写法不会失效，只是同样只影响 CSS 侧。）

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

#### 从 `--cf-*` 迁移

2.0 之前这套变量叫 `--cf-*`。2.0～2.2 期间以别名形式保留，**2.3.0 起已移除** —— 升级到 2.3 前把项目里的旧名按下表换掉，否则那些声明会静默失效（CSS 变量取不到值不会报错，只是回落到继承值或初始值）。

| 旧名 | 新名 | 旧名 | 新名 |
| --- | --- | --- | --- |
| `--cf-canvas` | `--vita-background` | `--cf-error` | `--vita-error` |
| `--cf-surface` | `--vita-surface` | `--cf-font-family` | `--vita-font-family` |
| `--cf-subtle` | `--vita-muted` | `--cf-font-size-sm` | `--vita-font-size-sm` |
| `--cf-border` | `--vita-border` | `--cf-font-size` | `--vita-font-size` |
| `--cf-border-weak` | `--vita-border-weak` | `--cf-font-size-lg` | `--vita-font-size-lg` |
| `--cf-text` | `--vita-foreground` | `--cf-radius-sm` | `--vita-radius-sm` |
| `--cf-text-2` | `--vita-muted-foreground` | `--cf-radius` | `--vita-radius` |
| `--cf-text-3` | `--vita-subtle-foreground` | `--cf-radius-lg` | `--vita-radius-lg` |
| `--cf-row-hover` | `--vita-hover` | `--cf-shadow-1` | `--vita-shadow-1` |
| `--cf-success` | `--vita-success` | `--cf-shadow-2` | `--vita-shadow-2` |
| `--cf-warning` | `--vita-warning` | `--cf-shadow-3` | `--vita-shadow-3` |

替换时按名字**从长到短**做，否则 `--cf-text` 会先吃掉 `--cf-text-2` 的前缀，得到 `--vita-foreground-2` 这种并不存在的变量。

### 不想让本库管 antd 主题

```tsx | pure
<ConfigProvider antdTheme={false}>...</ConfigProvider>
```

此时封装过的组件仍跟随 `--vita-*`，未封装的 antd 组件回到 antd 原生观感。也可以用 `theme` 属性在生成的配置之上再叠加自己的 token。

## 响应式与移动端

### 断点

断点与色彩、圆角同源，都出自 `tokens.json`。因为媒体查询的条件部分**不能用 CSS 变量**（`@media (max-width: var(--x))` 无效），断点会额外生成一份 SCSS mixin。

| 断点 | 值 |
| --- | --- |
| sm / md / lg / xl / xxl | 640 / 768 / 1024 / 1280 / 1536 px |

CSS 侧：

```scss
@use "@hsu-react/ui/es/styles/responsive" as r;

.panel {
  padding: 24px;
  @include r.down(md) { padding: 12px; }   // 视口 < md
  @include r.up(lg)   { padding: 32px; }   // 视口 >= lg
}
```

JS 侧（只在**结构**要变时才用，比如小屏把表格换成卡片列表；能用 CSS 解决的别用它 —— 媒体查询不需要 JS 参与、没有首屏闪烁）：

```tsx | pure
const { isMobile, up, down, current } = useBreakpoint();
```

### 移动端点击：不需要把 onClick 换成 onTouch

一个常见的做法是「移动端把 `onClick` 换成 `onTouchStart`」。**不要这么做**：触摸事件序列本来就会合成 click，`onClick` 在触屏上一直可用；换成 touch 会丢掉键盘可访问性、在滚动时误触发、并与合成的 click 重复触发。

之所以有人觉得必须换，通常是撞上了下面这几个真实问题 —— 它们各有各的正确解法，本库已在 `antd-overload.scss` 里统一处理：

| 现象 | 真正的原因 | 解法 |
| --- | --- | --- |
| 点击时元素上浮出一层「边框」，设 `border: none` 也没用 | `-webkit-tap-highlight-color` 默认是 `rgba(51,181,229,0.4)`，是 UA 在元素盒子上铺的覆盖层，与 border / background 无关 | `-webkit-tap-highlight-color: transparent` |
| 点击要等约 300ms 才响应 | 浏览器在等双击缩放 | `touch-action: manipulation` |
| 点完之后有一行/一项一直高亮，直到点别处 | 触屏上 `:hover` 会保持 | hover 样式包进 `@include r.hover`；antd 几处最显眼的悬停面已在 `@include r.touch` 里中和 |
| 小图标按钮点不中 | 粗指针下 24px 太小 | 粗指针下给最小可点面积兜底 |

焦点环不在此列：实测触摸点击后元素虽然会聚焦，但 `:focus-visible` 并不匹配，所以不会画出焦点环。

确实需要按指针类型**改变结构或尺寸**时用：

```tsx | pure
const { isTouch, isCoarse, canHover } = usePointerType();
```

它走媒体查询而不是 UA 嗅探 —— 二合一设备会在触摸与鼠标之间来回切换，媒体查询跟得上，UA 跟不上。

## 与 antd 混用

项目里同时引入本库和 antd 是常态 —— 本库只封装了业务高频的那十几个组件，`Steps`、`Card`、`Alert`、`Result` 这些你会直接从 `antd` 引。

**这些直接引入的 antd 组件会自动跟随本库的样式**，不需要额外配置：`ConfigProvider` 把同一份令牌喂给了 antd 的 `theme.token`，而 antd 的主题是走 React context 的，所以只要组件在 Provider 之内，无论从哪里 import 都吃同一套色板、圆角、字号与控件高度。

```tsx
import React from "react";
import { Alert, Card, Steps, Tag, Progress } from "antd";

export default () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <Steps
      size="small"
      current={1}
      items={[{ title: "已完成" }, { title: "进行中" }, { title: "待开始" }]}
    />
    <Alert type="info" showIcon title="这些组件全部直接 import from 'antd'" />
    <Card size="small" title="卡片">
      <Tag color="blue">标签</Tag> <Progress percent={60} size="small" />
    </Card>
  </div>
);
```

覆盖到的是令牌层：品牌色与语义色、中性色阶、圆角、字号、控件高度、阴影、focus ring、明暗切换。

### 两处覆盖不到的

1. **DOM 层面的观感微调**。本库对 antd 内部结构做的调整（菜单选中态、通知布局、Tabs 高度分配、移动端的点击高亮与 hover 处理等）在 `antd-overload.scss` 里，需要你在入口显式引入 —— 见下一节。

2. **本库自己扩展的能力**。比如 `Button` 的 `variant="surface"`（浅底 + 边框）是本库在 antd 之上加的，antd 原生的 `Button` 没有。

### 命令式反馈：message / notification / Modal.confirm

`message.success()`、`Modal.confirm()` 这类是命令式调用，触发时不在 React 树里，因此读不到 `ConfigProvider` 的主题 —— 这是 antd 一直以来的限制，官方给的解法是改用 `Modal.useModal()` / `message.useMessage()` 并把 `contextHolder` 渲染进树，代价是每个调用点都得先拿到实例，命令式的写法就没了。

本库把这层做掉了：`ConfigProvider` 内部挂了一个持有者组件，捕获那几个 hook 实例并渲染它们的 contextHolder，导出的同名函数只是转发。**调用写法不变，输出跟随主题。**

```tsx
import React from "react";
// 注意这里是从本库引入，不是从 antd
import { Button, Modal, message, notification } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
    <Button onClick={() => message.success("保存成功")}>message</Button>
    <Button onClick={() => notification.info({ message: "通知", description: "跟随主题" })}>
      notification
    </Button>
    <Button
      onClick={() => Modal.confirm({ title: "确认删除？", content: "此操作不可撤销" })}
    >
      Modal.confirm
    </Button>
  </div>
);
```

迁移就是把 import 来源从 `antd` 换成 `@hsu-react/ui`，其余不动：

```diff
- import { message, notification } from "antd";
+ import { message, notification } from "@hsu-react/ui";
```

`Modal.confirm` / `info` / `success` / `error` / `warning` 用本库的 `Modal` 即可，已经指向这一层。

没有挂 `ConfigProvider` 时会自动回退到 antd 的静态方法 —— 功能正常，只是不跟随主题，并在开发环境提示一次。

### 想让某个 antd 组件不跟随

`ConfigProvider` 可以就近嵌套，内层覆盖外层，这是 antd 自己的规则：

```tsx | pure
import { ConfigProvider as AntdConfigProvider } from "antd";

<AntdConfigProvider theme={{ token: { borderRadius: 2 } }}>
  <SomeAntdComponent />
</AntdConfigProvider>
```

整个应用都不想让本库插手，传 `<ConfigProvider antdTheme={false}>`。

## 引入全局样式（可选）

库附带了对 antd 的全局观感覆盖，按需在入口引入（产物为 scss，宿主项目需安装 `sass` 并具备 scss 编译能力）：

```ts
import "@hsu-react/ui/es/styles/antd-overload.scss";
import "@hsu-react/ui/es/styles/utils.scss";
```

> `antd-overload.scss` 内部已 `@use` 令牌文件，引入它就带上了整套 `--vita-*`。若只想要变量、不想要观感覆盖，单独引 `@hsu-react/ui/es/styles/tokens.scss` 即可。

### webpack 项目：loader 要放行本库的 scss 与图片

本库产物里带的是**未编译的 `.module.scss`** 和图片资源，交给消费方自己的 loader 处理 —— 这样 CSS Module 的类名哈希、`getLocalIdent` 等策略才由你说了算。于是 scss / 图片规则上需要开一个「排除 `node_modules`，但放行本库」的例外。

**别自己写正则**，直接用库导出的判定：

```js
// webpack.config.js（CJS）
const { excludeNodeModulesExceptHsuUi } = require("@hsu-react/ui/lib/build/webpack");

{ test: /\.scss$/,                       exclude: excludeNodeModulesExceptHsuUi, use: [...] }
{ test: /\.(png|jpe?g|gif|webp|svg)$/i,  exclude: excludeNodeModulesExceptHsuUi, type: "asset/resource" }
```

手写版本几乎都是 `/node_modules\/(?!@hsu-react\/ui\/)/`。它只看**第一个** `node_modules` 后面跟着什么：扁平安装（yarn / npm）下确实是 `@hsu-react/ui/`，但 pnpm 的真实路径是

```
node_modules/.pnpm/@hsu-react+ui@<版本>/node_modules/@hsu-react/ui/es/...
```

跟着的是 `.pnpm/`，否定前瞻立刻失败，本库的 scss 与图片会被**全部排除**，报 `no loaders are configured to process this file`。导出的这支按「整条路径里有没有 `@hsu-react/ui`」判断，扁平与嵌套都成立，也兼容 Windows 的 `\` 分隔符。

> Vite 项目不需要这一步 —— 它没有这种按路径写死的 loader 规则。

## 按需引入

组件库为 bundless 产物（`es/` 为 ESM、`lib/` 为 CJS），支持按目录按需引入：

```ts
import { Button, Panel, FormItem } from "@hsu-react/ui";
```

## 中后台布局（可选）

库里另带一套路由驱动的中后台布局：顶栏、菜单、面包屑、多页签栏，以及外观与国际化两个 Provider。文档见 [布局](/layouts/header)。

它**不从包根导出**，要走子路径引入：

```ts
import Layout from "@hsu-react/ui/es/layout";
import type { RouteType, MetaType } from "@hsu-react/ui/es/layout";
```

### 为什么单独一条路径

菜单、面包屑、页签都要读当前地址、要能跳转，因此依赖 `react-router`；语言切换依赖 `react-intl`。这两个是**可选 peerDependency**：

```json
"peerDependenciesMeta": {
  "react-router": { "optional": true },
  "react-intl": { "optional": true }
}
```

只用 `Button`、`Table` 这些的项目不用装它们。但如果布局也从包根导出，`import { Button } from "@hsu-react/ui"` 就会连带解析到 `react-router`，没装的项目直接构建失败 —— 那"可选"就名存实亡了。子路径把这条依赖链隔在需要它的人那边。

用到布局的项目需要自行安装这两个（版本要求 `react-router@6`、`react-intl@>=6`）：

```bash
npm i react-router@6 react-intl
```

> 应用侧通常还会用到 `react-router-dom` 提供的 `BrowserRouter`，那是应用自己的装配，与本库无关。
>
> 页签缓存用的 `react-activation` 已是本库的直接依赖，不用另装，但 `<AliveScope>` 需要由应用挂在路由出口外层。

### 路由配置的形状

三个路由驱动的组件都只认识 `RouteType` —— 就是 react-router 的 `RouteObject` 加了一个 `meta`，通常现有的路由配置不用改结构，补上 `meta` 即可：

```ts
import type { RouteType } from "@hsu-react/ui/es/layout";

const router: RouteType[] = [
  {
    path: "/system",
    meta: { name: "系统管理", menu: true, icon: <SettingOutlined /> },
    children: [
      { path: "/system/user", meta: { name: "用户", menu: true } },
      // 不写 menu：可访问，但不在菜单里
      { path: "/system/user/:id", meta: { name: "用户详情" } },
    ],
  },
];
```

`meta` 里哪些字段由布局组件读、哪些只是搭车给消费方自己用，见 [Header 的说明](/layouts/header#与路由的关系)。

### 装配顺序

```tsx | pure
<ConfigProvider permissions={perms} request={request}>
  <Layout.I18n defaultLocale="zh-CN">
    <Layout.Theme>
      <BrowserRouter>{/* Header / Menu / NavTabBar 与页面 */}</BrowserRouter>
    </Layout.Theme>
  </Layout.I18n>
</ConfigProvider>
```

`ConfigProvider` 在最外层提供全站主题，`Layout.Theme` 在内层只管外观三态与导航配色，两者不重复也不冲突（antd 嵌套主题内层胜）。
