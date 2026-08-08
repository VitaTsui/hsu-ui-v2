---
nav: 组件
group:
  title: 数据展示
  order: 4
title: Table 表格
---

# Table 表格

在 antd `Table` 之上封装，扩展了自定义列（权限、排序、省略 Tooltip）、内置分页、自动高度、行拖拽、自动滚动等能力。

## 引入

```ts
import { Table } from "@hsu-react/ui";
```

## 表格

```tsx
import React from "react";
import { Table } from "@hsu-react/ui";

const columns = [
  { title: "姓名", dataIndex: "name", width: 120 },
  { title: "年龄", dataIndex: "age", width: 80 },
  { title: "住址", dataIndex: "address" },
];

const dataSource = [
  { key: "1", name: "张三", age: 32, address: "西湖区湖底公园 1 号" },
  { key: "2", name: "李四", age: 28, address: "滨江区江南大道 100 号" },
  { key: "3", name: "王五", age: 45, address: "余杭区文一西路 998 号" },
];

export default () => (
  <Table columns={columns} dataSource={dataSource} pagination={false} />
);
```

## 子组件

```tsx | pure
Table.Drag              // 拖拽排序：Table.Drag.Handle 作为拖拽手柄列
Table.Summary           // antd 的合计行
Table.Column            // antd 的 JSX 声明列
Table.ColumnGroup
Table.EXPAND_COLUMN     // 展开列占位符，放进 columns 可指定展开图标位置
Table.SELECTION_COLUMN  // 选择列占位符，同上
Table.SELECTION_ALL
Table.SELECTION_INVERT
Table.SELECTION_NONE
```

`Summary` 最常用（渲染合计行）。`Column` / `ColumnGroup` 是 antd 的 JSX 列声明写法，与本库的 `columns` 属性是两条路子，混用会绕过本库的列处理管线（权限过滤、宽度分档、省略 tooltip 等），一般不建议。

## API

在 [antd TableProps](https://ant.design/components/table-cn) 基础上扩展（`scroll`、`pagination`、`columns` 被重写），常用新增/重写属性如下：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| columns | 列配置，使用自定义 `ColumnsType`（支持 `hidden`、`sort`、`hasPermi`、`help`、`mergeRow`、`fixedWidth`、`ellipsisPosition`、`measureAlign`、`measureText` 等） | `ColumnsType<RecordType>` | `[]` |
| scroll | 是否开启滚动；`{ y: false }` 可关闭纵向滚动 | `boolean \| { y: boolean }` | `false` |
| pagination | 分页配置；为 `false` 时不展示分页 | `false \| PaginationProps` | `{}` |
| autoWidth | 列宽自适应 | `boolean` | - |
| scrollAutoHeight | 自动计算并撑满可用高度 | `boolean` | `true` |
| hideScrollbar | 隐藏表头滚动条 | `boolean` | `true` |
| thPadding | 表头单元格内边距 | `string` | - |
| tdPadding | 表体单元格内边距 | `string` | - |
| expandedCellPadding | 展开行单元格内边距 | `string` | `tdPadding` |
| fillPanel | 撑满父级 Panel 高度 | `boolean` | - |
| staticDataSource | 使用静态数据源（前端分页） | `boolean` | `false` |
| serialNumberColumn | 是否展示序号列 | `boolean` | `false` |
| hideEmpty | 隐藏空数据占位 | `boolean` | `false` |
| ellipsisTooltipConfig | 文本省略 Tooltip 配置 | `EllipsisTooltipConfig` | - |
| onDragEnd | 行拖拽结束回调（开启后启用拖拽排序） | `DragProps["onDragEnd"]` | - |
| autoScrolling | 是否开启内容自动滚动 | `boolean` | - |
| autoScrollMode | 自动滚动模式 | `'smooth' \| 'row'` | - |
| autoScrollingSpeed | smooth 模式滚动速度（px/s） | `number` | `25` |
| autoScrollLoop | 滚动到末尾后是否循环 | `boolean` | `true` |
| autoScrollLoopMode | 循环模式 | `'reset' \| 'seamless'` | `'reset'` |
| onScrollEnd | 滚动到底部回调 | `() => void` | - |
| onAutoScrollEndAdd | 自动滚动到底部时追加数据 | `() => Promise<boolean>` | - |
| order | 当前排序 | `{ k: string; t: 'asc' \| 'desc' }` | - |
| onOrderChange | 排序变化回调 | `(order?) => void` | - |
| sorter | 是否启用排序 | `boolean` | - |
| showTotal | 自定义分页总数展示；为 `false` 时不展示 | `false \| ((total, range) => ReactNode)` | - |
| isExpandedCellTable | 是否为展开行内嵌表格样式 | `boolean` | `false` |

### ColumnType 扩展字段：measureAlign

数字/金额/单量列适用：按本列所有行展示文本测量出最大像素宽，把单元格内容包进该定宽块内右对齐，块本身随列 `align` 居中——各行右边缘对齐、整体在列内居中。

| 字段 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| measureAlign | 开启定宽右对齐（配合列 `align: "center"` 使用） | `boolean` | - |
| measureText | 测量宽度所用文本；当单元格由 `render` 产出复合/JSX 内容时，用它提供与展示一致的文本（默认取 `dataIndex` 原始值） | `(record) => string` | - |

- 列宽自适应：声明的 `width` 只作下限——实际列宽会按「本列最宽内容块的测量宽 + 单元格左右内边距」自动抬升，出现超长值（如 `+3357.52%`）时内容不会被声明宽度截断。

> 注意：不适用于 `render` 返回 `{ children, rowSpan }` 这类合并单元格场景。

> 另导出 `TableDrag`，用于行拖拽排序场景。
