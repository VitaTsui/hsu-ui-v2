---
nav: 组件
group:
  title: 数据录入
  order: 3
title: Search 搜索
---

# Search 搜索

配置驱动的搜索栏组件，通过 `searchItems` 描述搜索项，内置查询 / 重置按钮、列自适应与展开收起能力。

## 引入

```ts
import { Search } from "@hsu-react/ui";
```

## 搜索

`Search` 通过 `searchItems`（复用 `FormItem` 的配置）定义搜索项，`onSearch` / `onReset` 接收回调：

```tsx
import React from "react";
import { Search } from "@hsu-react/ui";

export default () => {
  return (
    <>
      <Search
        columnNum={3}
        searchItems={[
          { type: "INPUT", name: "keyword", label: "关键字" },
          {
            type: "SELECT",
            name: "status",
            label: "状态",
            componentProps: {
              options: [
                { label: "启用", value: 1 },
                { label: "停用", value: 0 },
              ],
            },
          },
          { type: "RANGEPICKER", name: "date", label: "时间范围" },
        ]}
        onSearch={(data) => console.log("search", data)}
        onReset={() => console.log("reset")}
      />
    </>
  );
};
```

`Search` 在基础形态外，额外提供多种搜索形态。除 `Search.Card` 使用 `options` 配置外，其余均复用 `searchItems`（`FormItemProps[]`）+ `onSearch` / `onReset`。

## 高级筛选

不显示标签，通过抽屉承载更多筛选项；配合 `setFilter` 可显示筛选项下拉。

```tsx
import React from "react";
import { Search } from "@hsu-react/ui";

export default () => (
  <>
    <Search.Advanced
      columnNum={3}
      setFilter
      searchItems={[
        { type: "INPUT", name: "name", label: "姓名" },
        {
          type: "SELECT",
          name: "status",
          label: "状态",
          componentProps: {
            options: [
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 },
            ],
          },
        },
      ]}
      moreSearchItems={[{ type: "INPUT", name: "remark", label: "备注" }]}
      onSearch={(data) => console.log("search", data)}
      onReset={() => console.log("reset")}
    />
  </>
);
```

## 可折叠搜索

整块搜索区可折叠 / 展开，通过 `defaultExpanded` 控制初始状态，`onCollapseToggle` 监听折叠变化。

```tsx
import React from "react";
import { Search } from "@hsu-react/ui";

export default () => (
  <>
    <Search.Collapsible
      columnNum={3}
      defaultExpanded
      searchItems={[
        { type: "INPUT", name: "name", label: "姓名" },
        {
          type: "SELECT",
          name: "status",
          label: "状态",
          componentProps: {
            options: [
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 },
            ],
          },
        },
      ]}
      onCollapseToggle={(c) => console.log("collapse", c)}
      onSearch={(data) => console.log("search", data)}
      onReset={() => console.log("reset")}
    />
  </>
);
```

## 带筛选器搜索

在按钮组旁内置筛选下拉，允许用户动态勾选要显示的搜索项，`onFilterChange` 接收勾选变化。

```tsx
import React from "react";
import { Search } from "@hsu-react/ui";

export default () => (
  <>
    <Search.WithFilter
      columnNum={3}
      searchItems={[
        { type: "INPUT", name: "name", label: "姓名" },
        {
          type: "SELECT",
          name: "status",
          label: "状态",
          componentProps: {
            options: [
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 },
            ],
          },
        },
        { type: "INPUT", name: "phone", label: "电话" },
      ]}
      onFilterChange={(items) => console.log("filter", items)}
      onSearch={(data) => console.log("search", data)}
      onReset={() => console.log("reset")}
    />
  </>
);
```

## 带更多项搜索

把搜索项分为基础项（`searchItems`）与更多项（`moreSearchItems`，必填），始终展示全部并提供展开收起。

```tsx
import React from "react";
import { Search } from "@hsu-react/ui";

export default () => (
  <>
    <Search.WithMore
      columnNum={3}
      searchItems={[
        { type: "INPUT", name: "name", label: "姓名" },
        {
          type: "SELECT",
          name: "status",
          label: "状态",
          componentProps: {
            options: [
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 },
            ],
          },
        },
      ]}
      moreSearchItems={[
        { type: "INPUT", name: "phone", label: "电话" },
        { type: "INPUT", name: "remark", label: "备注" },
      ]}
      onSearch={(data) => console.log("search", data)}
      onReset={() => console.log("reset")}
    />
  </>
);
```

## 卡片式搜索

标签式快捷筛选，使用 `options`（`SearchCardOption[]`）而非 `searchItems`，`onChange` 返回当前选中值；支持 `multiple` 多选与 `showSearchBox` 搜索框。

```tsx
import React from "react";
import { Search } from "@hsu-react/ui";

export default () => (
  <>
    <Search.Card
      options={[
        {
          label: "状态",
          name: "status",
          items: [
            { label: "启用", value: 1 },
            { label: "禁用", value: 0 },
          ],
        },
        {
          label: "类型",
          name: "type",
          multiple: true,
          items: [
            { label: "普通", value: "normal" },
            { label: "重要", value: "important" },
            { label: "紧急", value: "urgent" },
          ],
        },
      ]}
      onChange={(data) => console.log("change", data)}
    />
  </>
);
```

## API

`SearchProps` 继承自 `BaseSearchProps`：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| searchItems | 搜索项配置（复用 `FormItemProps`） | `FormItemProps[]` | `[]` |
| moreSearchItems | 展开后显示的更多搜索项 | `FormItemProps[]` | `[]` |
| onSearch | 点击查询的回调，返回收集到的表单值 | `(data?: Partial<T>) => void` | - |
| onReset | 点击重置的回调 | `() => void` | - |
| externalForm | 外部传入的表单实例 | `FormInstance` | - |
| hasPermi | 权限码；无权限时不渲染 | `string[]` | - |
| columnNum | 搜索项列数（按钮组额外占一列） | `number` | `4` |
| beforeButtonGroup | 查询 / 重置按钮前的附加按钮 | `BasicButtonProps[]` | - |
| affterButtonGroup | 查询 / 重置按钮后的附加按钮 | `BasicButtonProps[]` | - |
| searchData | 搜索项的初始值 | `Record<string, unknown>` | - |
| minLabelWidth | 标签最小宽度，或是否启用最小宽度 | `boolean \| number` | - |
| defaultExpanded | 默认是否展开 | `boolean` | `false` |
| onExpandChange | 展开状态变化回调 | `(expand: boolean) => void` | - |
| autoAdaptWidth | 是否启用基于宽度的自适应布局 | `boolean` | `true` |
| baseWidth | 自适应布局的基准宽度 | `number` | - |
| onValuesChange | 表单值变化回调 | `(value, values) => void` | - |
| searchDisabled | 是否禁用查询按钮 | `boolean` | `false` |
| showAllSearchItems | 是否一次性展示全部搜索项 | `boolean` | `false` |
| searchText | 查询按钮文本 | `ReactNode` | - |
| resetText | 重置按钮文本 | `ReactNode` | - |
| columnOffsetWidth | 列宽计算的偏移量 | `number` | `0` |

> 另提供多种搜索形态：`Search.Card`、`Search.Advanced`、`Search.Collapsible`、`Search.WithFilter`（带筛选下拉）、`Search.WithMore`。
