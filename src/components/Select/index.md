---
nav: 组件
group:
  title: 数据录入
  order: 3
title: Select 选择器
---

# Select 选择器

基于 antd `Select` 封装的选择器，默认开启搜索与清除，支持前后缀、箭头动画、下拉宽度自适应内容、`label` 与 `value` 组合展示，并对中文输入法搜索做了优化。

## 引入

```ts
import { Select } from "@hsu-react/ui";
```

## 选择器

```tsx
import React from "react";
import { Select } from "@hsu-react/ui";

const options = [
  { label: "苹果", value: "apple" },
  { label: "香蕉", value: "banana" },
  { label: "橙子", value: "orange" },
];

export default () => {
  const [value, setValue] = React.useState("apple");

  return (
    <Select
      style={{ width: 200 }}
      options={options}
      value={value}
      onChange={setValue}
      placeholder="请选择"
    />
  );
};
```

## 子组件

```tsx | pure
Select.Tree          // 树形选择器（TreeSelect）
Select.AutoComplete  // 自动补全选择器
Select.Icon          // 图标选择器
Select.Option        // antd 的 Select.Option
Select.OptGroup      // antd 的 Select.OptGroup
```

前三个是本库自己的封装，0.1.0 之前只在库内部使用、并未对外导出。`Option` / `OptGroup` 是 antd 原样透出，供 JSX 写法 —— 本库更推荐用 `options` 属性，选项多时性能也更好。

## API

在 [antd SelectProps](https://ant.design/components/select-cn) 基础上扩展（移除了 `placement`、`filterOption` 并重新定义）：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| options | 选项数据 | `SelectOption[]` | `[]` |
| prefix | 选择框前缀内容 | `ReactNode` | - |
| suffix | 选择框后缀内容 | `ReactNode` | - |
| selectClassName | 内层 antd Select 的类名 | `string` | - |
| arrowAnimation | 是否启用箭头展开动画 | `boolean` | `true` |
| popupMatchContentWidth | 下拉面板宽度是否自适应内容 | `boolean` | - |
| placement | 下拉弹出位置 | `'bottomLeft' \| 'topLeft'` | `'bottomLeft'` |
| filterOption | 自定义搜索过滤 | `(searchValue: string, option?: DefaultOptionType) => boolean` | - |
| optionFontSize | 选项字体大小，用于计算自适应宽度 | `number` | `14` |
| valueInlabel | 在标签/选项中同时展示 value 的位置 | `'before' \| 'after'` | - |

> `SelectOption` 形如 `{ label: string; value: number \| string; disabled?: boolean }`，并可携带额外字段。
