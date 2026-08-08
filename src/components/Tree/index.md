---
nav: 组件
group:
  title: 数据展示
  order: 4
title: Tree 树形控件
---

# Tree 树形控件

在 antd `Tree` 之上增强：内置标题栏、搜索过滤、按层级默认展开、勾选半选自动规范化、选中路径回调与权限控制。

## 引入

```ts
import { Tree } from "@hsu-react/ui";
```

## 树形控件

通过 `treeData` 传入树数据，开启 `search` 即可在标题栏内搜索过滤节点。

```tsx
import React from "react";
import { Tree } from "@hsu-react/ui";

const treeData = [
  {
    title: "华东区",
    key: "1",
    value: "1",
    children: [
      { title: "上海", key: "1-1", value: "1-1" },
      { title: "杭州", key: "1-2", value: "1-2" },
    ],
  },
  {
    title: "华南区",
    key: "2",
    value: "2",
    children: [{ title: "广州", key: "2-1", value: "2-1" }],
  },
];

export default () => (
  <div style={{ height: 280 }}>
    <Tree
      title="区域"
      search
      treeData={treeData}
      defaultExpandLevel={1}
      onSelectPath={(path) => console.log(path)}
    />
  </div>
);
```

## 子组件

```tsx | pure
Tree.DirectoryTree  // antd 的目录树（文件夹图标 + 目录态选中）
Tree.TreeNode       // antd 的 JSX 节点声明
```

`TreeNode` 供 JSX 写法，本库更推荐用 `treeData`。

## API

在 [antd TreeProps](https://ant.design/components/tree-cn)（已 `Omit` 掉 `treeData`、`loadData`、`loadedKeys`、`titleRender`）基础上扩展：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| treeData | 树数据 | `TreeData[]` | `[]` |
| title | 标题栏标题 | `ReactNode` | - |
| search | 是否显示搜索框 | `boolean` | - |
| searchProps | 搜索框（Input）属性 | `InputProps` | - |
| titleRender | 自定义节点渲染 | `(data: TreeData) => ReactNode` | - |
| onChange | 勾选变化回调 | `(checked: CheckedKeys) => void` | - |
| onSelectPath | 节点选中回调，返回选中节点的完整路径 | `(path: TreeData[] \| null, selectedKeys: Key[]) => void` | - |
| allowDeselect | 点击已选中节点时是否允许取消选中 | `boolean` | `true` |
| defaultExpandLevel | 默认展开层级（从 1 开始） | `number` | - |
| hideLeafExpand | 是否隐藏叶子节点的展开图标 | `boolean` | - |
| indent | 缩进单位宽度（px） | `number` | - |
| switchWidth | 展开/收起图标宽度（px） | `number` | - |
| switchGap | 展开/收起图标与节点的间距（px） | `number` | - |
| buttonGroup | 标题栏按钮组 | `ButtonProps[]` | - |
| btnPosition | 按钮组位置 | `'left' \| 'right'` | `'right'` |
| hasPermi | 权限码，无权限时不渲染 | `string[]` | - |
| treeClassName / treeContainerClassName / titleClassName / titleSearchBarClassName | 各区域自定义类名 | `string` | - |

`TreeData` 结构（继承 antd 节点字段）：`title`、`key`、`value`、`selectable`、`disabled`、`disableCheckbox`、`isLeaf`、`checkable`、`icon`、`children`。
