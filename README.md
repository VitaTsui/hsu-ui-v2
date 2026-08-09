# @hsu-react/ui

[![npm version](https://img.shields.io/npm/v/@hsu-react/ui.svg)](https://www.npmjs.com/package/@hsu-react/ui)
[![license](https://img.shields.io/npm/l/@hsu-react/ui.svg)](./LICENSE)

一套基于 **React + Ant Design** 的中后台业务组件库，把「列表 + 搜索 + 表单弹窗 + CRUD」这类重复劳动沉淀为页面级组件，并内置 Markdown / CodeMirror / Spreadsheet / Chart / Editor 等内容组件。

📖 **文档与在线示例：https://vitatsui.github.io/hsu-ui-v2**

## 安装

```bash
yarn add @hsu-react/ui
# peerDependencies
yarn add react react-dom antd@^6 @ant-design/icons@^6 mobx mobx-react-lite
```

两条版本线并行，包名同为 `@hsu-react/ui`，但分仓维护：

| 版本线 | 依赖 | 仓库 |
| --- | --- | --- |
| **2.x**（本仓库） | antd v6 | [VitaTsui/hsu-ui-v2](https://github.com/VitaTsui/hsu-ui-v2) |
| **1.x** | antd v5 | [VitaTsui/hsu-ui](https://github.com/VitaTsui/hsu-ui)，`npm i @hsu-react/ui@1` |

## 浏览器支持

Chrome / Edge ≥ 111、Safari ≥ 16.4、Firefox ≥ 121（现代浏览器，不支持 IE），与 antd v6 的口径一致。更老的浏览器不会白屏，但焦点环、选中底色等依赖 `color-mix()` / `:has()` 的样式会失效，详见[文档](https://vitatsui.github.io/hsu-ui-v2/guide#%E6%B5%8F%E8%A7%88%E5%99%A8%E6%94%AF%E6%8C%81)。

## 使用

```tsx
import { ConfigProvider, Button } from "@hsu-react/ui";
import { get, post, del, put } from "@/services/Axios";

export default function App() {
  return (
    <ConfigProvider permissions={userPermissions} request={{ get, post, del, put }}>
      <Button type="primary">Hello Hsu UI</Button>
    </ConfigProvider>
  );
}
```

- `ConfigProvider.permissions` — 当前用户权限码，驱动所有 `hasPermi` 的显隐校验。
- `ConfigProvider.request` — 注入 HTTP 请求实现（库本身不绑定 HTTP 客户端）。

可选引入全局 antd 观感覆盖（产物为 scss，宿主项目需具备 scss 编译能力）：

```ts
import "@hsu-react/ui/es/styles/antd-overload.scss";
```

## 开发

```bash
yarn          # 安装依赖
yarn dev      # 启动 dumi 文档站
yarn build    # father 构建 es/ + lib/ + 类型
yarn docs:build  # 构建文档站静态产物
```

## 组件一览

通用 `Button` `Icon` `Copy` `Operate` ·
布局 `Panel` `FlexFill` `TabBar` ·
数据录入 `Input` `Select` `Checkbox` `Switch` `Slider` `DatePicker` `Form` `FormItem` `Upload` `CodeMirror` `Editor` `SecondConf` `Search` ·
数据展示 `Table` `Tags` `Descriptions` `Tree` `TextEllipsis` `FileCol` `FilePreview` `Chart` `Markdown` `Spreadsheet` `ChainGraph` ·
反馈 `Modal` · AI `Chat`

详见文档站。

## 贡献

日常开发在 `develop` 分支进行（feature 分支合入 `develop`），`main` 只接受来自 `develop` 的 PR；合入 `main` 后按 `package.json` 版本自动打 tag 并发布 npm（dist-tag 为 `latest`）。PR 标题遵循 [Conventional Commits](https://www.conventionalcommits.org/)。

旧大版本走 `<major>.x` 维护分支（如 `1.x`），bugfix 直接合进去，push 后同样自动发布，但 dist-tag 是 `v<major>`（如 `v1`）而**不是** `latest` —— 否则一次维护版发布会把所有人的 `npm i` 拽回旧大版本。安装旧线用 `npm i @hsu-react/ui@1` 即可，走的是 semver，与 dist-tag 无关。

## License

[MIT](./LICENSE) © VitaHsu
