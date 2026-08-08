---
nav: 组件
group:
  title: 数据展示
  order: 4
title: Descriptions 描述列表
---

# Descriptions 描述列表

在 antd `Descriptions` 之上支持以 `columns` + `dataSource` 的方式声明式渲染，内置权限过滤、排序与标签宽度自适应。

## 引入

```ts
import { Descriptions } from "@hsu-react/ui";
```

## 描述列表

```tsx
import React from "react";
import { Descriptions } from "@hsu-react/ui";

export default () => (
  <Descriptions
    column={2}
    columns={[
      { title: "姓名", dataIndex: "name" },
      { title: "年龄", dataIndex: "age" },
      { title: "手机号", dataIndex: "phone" },
      {
        title: "状态",
        dataIndex: "status",
        render: (value) => (value === 1 ? "启用" : "停用"),
      },
    ]}
    dataSource={{ name: "张三", age: 28, phone: "13800000000", status: 1 }}
  />
);
```

## 子组件

```tsx | pure
Descriptions.Item  // antd 的 Descriptions.Item
```

供 JSX 写法，本库更推荐用 `items` 或 `columns`（`columns` 还带权限过滤与排序）。

## API

在 [antd DescriptionsProps](https://ant.design/components/descriptions-cn) 基础上扩展：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| columns | 列配置，声明式描述每项内容 | `ColumnsType[]` | - |
| dataSource | 数据源，配合 `columns` 的 `dataIndex` 取值 | `Record<string, unknown>` | `{}` |

`ColumnsType` 字段：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标签文本 | `string` | - |
| dataIndex | 取值字段 | `string` | - |
| hidded | 是否隐藏该项 | `boolean` | - |
| sort | 排序权重（升序） | `number` | - |
| hasPermi | 权限码；无权限时不渲染该项 | `string[]` | - |
| render | 自定义渲染内容 | `(value: unknown, record: Record<string, unknown>) => ReactNode` | - |
