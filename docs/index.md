---
title: Hsu UI - 中后台业务组件库
hero:
  title: Hsu UI
  description: 一套基于 React + Ant Design 的中后台业务组件库，开箱即用的页面级 Panel、表单、表格与丰富的内容组件
  actions:
    - text: 快速上手
      link: /guide
    - text: 组件总览
      link: /components/button
features:
  - title: 页面级开箱即用
    emoji: 🚀
    description: Panel / ListPanel / FormItem 等业务组件，列表 + 搜索 + 表单弹窗 + CRUD 一把梭
  - title: 基于 Ant Design
    emoji: 🐜
    description: 在 antd 6 之上做业务封装，沿用熟悉的 API 与主题令牌，平滑接入存量项目
  - title: 请求层解耦
    emoji: 🔌
    description: 智能组件通过 ConfigProvider 注入请求实现，不绑定任何 HTTP 客户端
  - title: 内容能力丰富
    emoji: 🧩
    description: 内置 Markdown、CodeMirror、Spreadsheet、Chart、Editor、FilePreview 等重型组件
  - title: 权限内建
    emoji: 🔐
    description: hasPermi + usePermissions 贯穿按钮 / 表单 / 操作列，权限码即声明即生效
  - title: TypeScript
    emoji: 💪
    description: 全量类型定义，配合 dumi 文档与可运行 Demo
---

## 安装

```bash
npm i @hsu-react/ui
# 或
yarn add @hsu-react/ui
```

> peerDependencies：`react >=18`、`react-dom >=18`、`antd >=6`、`@ant-design/icons >=6`、`mobx >=6`、`mobx-react-lite >=4`，请在宿主项目中安装。

## 一分钟上手

```tsx | pure
import { ConfigProvider, Button } from "@hsu-react/ui";
import { get, post, del, put } from "@/services/Axios"; // 你项目里的请求封装

export default function App() {
  return (
    <ConfigProvider permissions={["sys:user:add"]} request={{ get, post, del, put }}>
      <Button hasPermi={["sys:user:add"]} type="primary">
        新增
      </Button>
    </ConfigProvider>
  );
}
```
