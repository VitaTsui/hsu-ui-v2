---
nav: 组件
group:
  title: 布局
  order: 2
title: Panel 页面容器
---

# Panel 页面容器

页面级容器集合，封装了「左侧树 + 顶部搜索 + 表格」的列表页、内嵌 iframe 页以及通用内容页等常见布局形态。

## 引入

```ts
import { Panel } from "@hsu-react/ui";
```

## 子组件一览

| 组件 | 说明 |
| --- | --- |
| `Panel.List` | 列表页容器，集成 `Search`、`Table`、`TabBar`、`Tree`、列管理与工具栏 |
| `Panel.List.Modal` | 弹窗内的列表页容器，用于在 `Modal` 中复用列表布局 |
| `Panel.Iframe` | iframe 内容容器，带加载态与全屏按钮 |
| `Panel.Default` | 通用内容容器，可选左侧树与面包屑 |

## 列表页

`Panel.List` 通过 `searchProps`（搜索区）、`tableProps`（表格区）组合出标准增删改查列表页。下方为可交互示例：输入姓名搜索会实时过滤行，点击「新增」「编辑」有反馈。

```tsx
import React, { useState } from "react";
import { Panel, Button } from "@hsu-react/ui";
import { message } from "antd";

const ALL = [
  { id: 1, name: "张三", role: "管理员", status: "启用" },
  { id: 2, name: "李四", role: "成员", status: "启用" },
  { id: 3, name: "王五", role: "成员", status: "禁用" },
];

export default () => {
  const [data, setData] = useState(ALL);

  const columns = [
    { title: "姓名", dataIndex: "name" },
    { title: "角色", dataIndex: "role" },
    { title: "状态", dataIndex: "status" },
    {
      title: "操作",
      dataIndex: "op",
      render: (_, row) => (
        <Button type="link" onClick={() => message.info("编辑：" + row.name)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    // Panel.List 为页面级宽组件；窄屏时外层横向滚动，避免溢出预览框。
    // overflowY:hidden 去掉垂直滚动条；wrapperClassName 放开组件内层
    // ListPanelWrapper 的 overflow:hidden（否则搜索区右侧约 24px 会被裁）。
    <div style={{ overflowX: "auto", overflowY: "hidden" }}>
      <div style={{ minWidth: 1000, height: 300 }}>
        <Panel.List
          wrapperClassName="hsu-demo-panel-wrapper"
          searchProps={{
            searchItems: [{ type: "INPUT", name: "name", label: "姓名" }],
            onSearch: (v) =>
              setData(ALL.filter((x) => !v.name || x.name.includes(v.name))),
            onReset: () => setData(ALL),
            beforeButtonGroup: [
              {
                title: "新增",
                color: "primary",
                onClick: () => message.success("点击了新增"),
              },
            ],
          }}
          tableProps={{
            columns,
            dataSource: data,
            rowKey: "id",
            pagination: false,
            scrollAutoHeight: false,
          }}
        />
      </div>
    </div>
  );
};
```

## 内容页

```tsx
import React from "react";
import { Panel } from "@hsu-react/ui";

export default () => (
  // 与列表页一致：外层 overflowX 横向滚动 + overflowY:hidden 去垂直滚动条；
  // wrapperClassName 放开 DefaultPanel 内层的 overflow:hidden。
  <div style={{ overflowX: "auto", overflowY: "hidden" }}>
    <div style={{ minWidth: 1000, height: 200 }}>
      <Panel.Default wrapperClassName="hsu-demo-panel-wrapper">
        <div style={{ padding: 16 }}>这里是通用内容区域（窄屏时可横向滚动查看）</div>
      </Panel.Default>
    </div>
  </div>
);
```

## 内嵌页

`Panel.Iframe` 用于内嵌外部页面，带加载态与全屏按钮（外部站点受 X-Frame-Options 限制，此处仅示意用法）：

```tsx | pure
import React from "react";
import { Panel } from "@hsu-react/ui";

export default () => <Panel.Iframe src="https://example.com" fullBtn />;
```

## 弹窗内列表

`Panel.List.Modal` 在 `Modal` 内复用列表布局，本身继承 `ModalProps`（`open` / `onClose` 等），并通过 `searchProps`、`tableProps` 配置搜索区与表格区。常用于从某条记录弹出其关联子列表。

```tsx
import React, { useState } from "react";
import { Panel, Button } from "@hsu-react/ui";

const ALL = [
  { id: 1, name: "明细一", status: "启用" },
  { id: 2, name: "明细二", status: "禁用" },
];

export default () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(ALL);

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        打开子列表
      </Button>
      <Panel.List.Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="关联明细"
        footer={null}
        searchProps={{
          searchItems: [{ type: "INPUT", name: "name", label: "名称" }],
          onSearch: (v) =>
            setData(ALL.filter((x) => !v.name || x.name.includes(v.name))),
          onReset: () => setData(ALL),
        }}
        tableProps={{
          columns: [
            { title: "名称", dataIndex: "name" },
            { title: "状态", dataIndex: "status" },
          ],
          dataSource: data,
          rowKey: "id",
          pagination: false,
        }}
      />
    </>
  );
};
```

## API

### Panel.List（ListPanelProps）

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| searchMode | Search 组件模式：`Default` / `Advanced` / `Collapsible` / `WithFilter` / `WithMore` / `Card` | `SearchModeKeys` | `'Default'` |
| searchProps | 搜索区配置（随 `searchMode` 变化） | `SearchModePropsMap[T]` | - |
| tableProps | 表格区配置，含 `title`、`buttonGroup`、`tabBarProps`、`tableTools` 等 | `ListPanelTabelProps` | - |
| treeProps | 左侧树配置 | `TreeProps` | - |
| headerTabBarProps | 顶部页签配置 | `TabBarProps` | - |
| headerTabBarChildren | 顶部页签区自定义内容 | `ReactNode` | - |
| hasPermi | 权限码，无权限时不渲染 | `string[]` | - |
| baseTreeBreadcrumb | 树面包屑的基础项 | `BreadcrumbProps['items']` | - |
| showTreeBreadcrumb | 是否展示树面包屑 | `boolean` | `true` |
| treeResize | 左侧树可拖拽调宽配置（`enabled`/`defaultWidth`/`minWidth`/`maxWidth`/`minContentWidth`） | `object` | - |
| className / wrapperClassName | 自定义类名 | `string` | - |

### Panel.Iframe（IframePanelProps）

继承原生 `<iframe>` 属性，并扩展：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| fullBtn | 是否显示全屏按钮 | `boolean` | - |
| children | 自定义内容（传入后替代 iframe 渲染） | `ReactNode` | - |

### Panel.Default（DefaultPanelProps）

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| children | 内容区 | `ReactNode` | - |
| treeProps | 左侧树配置（传入即展示树） | `TreeProps` | - |
| baseTreeBreadcrumb | 树面包屑的基础项 | `BreadcrumbProps['items']` | - |
| showTreeBreadcrumb | 是否展示树面包屑 | `boolean` | `true` |
| className / contentClassName / wrapperClassName | 自定义类名 | `string` | - |
