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

前三个是本库自己的封装，2.0 之前只在库内部使用、并未对外导出。`Option` / `OptGroup` 是 antd 原样透出，供 JSX 写法 —— 本库更推荐用 `options` 属性，选项多时性能也更好。

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

## Select.Icon 图标选择器

默认提供 ant-design / ep / fa / fa-solid 四整套（约 2.1 万枚），左侧输入框可自由输入图标名。

### 只给能用的：`icons`

很多项目**并不是这四套都能画**：随首屏注册的往往只是其中一个精简子集，选了子集之外的图标，存下来就是一个空位。这种情况下界面不该提供一个「选了会被拒 / 选了画不出来」的选项。

传 `icons`（允许的图标全名清单）进入**受限模式**：

```tsx | pure
// 清单请放模块级常量或 useMemo，别每次渲染新建一个数组
const ALLOWED = ["ant-design:home-outlined", "ant-design:setting-outlined", "ep:user"];

<Select.Icon value={icon} onChange={setIcon} icons={ALLOWED} />;
```

- 面板里**只出现清单里的图标**，Tabs 按清单里出现过的前缀自动分组（认得的前缀用它的正式名，认不得的直接用前缀本身）；
- 左侧输入框转为**只读** —— 自由输入是这个组件唯一的旁路，不关掉的话「只给能用的」就只是摆设。清空仍然可以（输入框自带清除按钮），因为「不设图标」总是合法的；
- 那四套整集（约 1.9 MB）**一个字节都不会下载**。

**不传 `icons` 就是原来的行为**，已有用法零改动。

> 清单里的图标要**已经注册过**才画得出来（本库自带的那批，或你用 `addIconCollection` 注册过的）。没注册的名字在面板里就是空格子，开发期控制台有警告。

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 图标全名（`prefix:name`） | `string` | - |
| onChange | 选中变化 | `(value: string) => void` | - |
| disabled | 禁用 | `boolean` | - |
| icons | 允许选择的图标全名清单；传了即进入受限模式 | `string[]` | - |
