---
nav: 组件
group:
  title: 数据录入
  order: 3
title: Input 输入框
---

# Input 输入框

基于 antd `Input` 封装的受控输入框，内置中文输入法合成处理、防抖 `onChange`（返回纯字符串）、自动 `allowClear`、可选 `Tooltip` 及字符转义能力。

## 引入

```ts
import { Input } from "@hsu-react/ui";
```

## 输入框

```tsx
import React from "react";
import { Input } from "@hsu-react/ui";

export default () => {
  const [value, setValue] = React.useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
      <Input placeholder="请输入" value={value} onChange={setValue} />
      <Input placeholder="禁用状态" disabled />
    </div>
  );
};
```

## 数字输入框

数字输入框，`onChange` 返回**字符串**，内置 `allowClear`、`controls={false}` 与 `stringMode`。

返回字符串是刻意的：`stringMode` 让超出 IEEE754 安全范围的大数（订单号、雪花 ID）
不丢精度，而转成 `number` 就丢了。

> **注意**：作为**表单字段**用时（`FormItem type="INPUTNUMBER"`）行为不同 ——
> 自 `2.5.0` 起它交给表单的是 `number | null`。表单值通常会直接进请求体，
> 而后端字段多半是整数，交字符串上去会被强类型服务端拒掉。
> 详见 [FormItem 的 INPUTNUMBER](/components/form-item)。

```tsx
import React from "react";
import { Input } from "@hsu-react/ui";

export default () => {
  const [value, setValue] = React.useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input.Number placeholder="请输入数字" value={value} onChange={setValue} />
      <Input.Number placeholder="带单位" addonAfter="元" />
    </div>
  );
};
```

## 密码框

密码输入框，支持显示/隐藏切换，`onChange` 返回纯字符串。

```tsx
import React from "react";
import { Input } from "@hsu-react/ui";

export default () => {
  const [value, setValue] = React.useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input.Password placeholder="请输入密码" value={value} onChange={setValue} />
      <Input.Password placeholder="禁用状态" disabled />
    </div>
  );
};
```

## 范围输入

范围输入框，`type` 支持 `"NUMBER"` 或 `"INPUT"`，`onChange` 返回 `[起, 止]` 元组。

```tsx
import React from "react";
import { Input } from "@hsu-react/ui";

export default () => {
  const [value, setValue] = React.useState();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input.Range
        type="NUMBER"
        value={value}
        onChange={setValue}
        placeholder={["最小值", "最大值"]}
        allowClear
      />
    </div>
  );
};
```

## 搜索框

搜索输入框，支持 `onSearch` 回调与搜索按钮，`onChange` 返回纯字符串。

```tsx
import React from "react";
import { Input } from "@hsu-react/ui";

export default () => {
  const [value, setValue] = React.useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input.Search
        placeholder="请输入关键字"
        value={value}
        onChange={setValue}
        enterButton
        onSearch={(v) => console.log("search:", v)}
      />
    </div>
  );
};
```

## 多行文本框

多行文本输入框，`onChange` 返回纯字符串，支持 `autoSize`、`prefix` / `suffix`。

```tsx
import React from "react";
import { Input } from "@hsu-react/ui";

export default () => {
  const [value, setValue] = React.useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input.TextArea
        placeholder="请输入内容"
        value={value}
        onChange={setValue}
        autoSize={{ minRows: 2, maxRows: 4 }}
      />
    </div>
  );
};
```

## 验证码输入框

`Input.OTP` 是 antd v6 新增的分格验证码输入框，原样透出。

```tsx
import React from "react";
import { Input } from "@hsu-react/ui";

export default () => <Input.OTP length={6} onChange={(v) => console.log(v)} />;
```

> 子组件一览：`Input.Search`、`Input.TextArea`、`Input.Password`、`Input.Number`、`Input.Range`、`Input.OTP`。
> 前五个是本库封装（`Number` / `Range` 为本库独有），`OTP` 为 antd 原样透出。

## API

在 [antd InputProps](https://ant.design/components/input-cn) 基础上扩展（并移除了 `onCompositionStart`、`onCompositionEnd`、`ref`，重写了 `onChange`）：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| onChange | 值变化回调，经过合成与防抖处理后返回纯字符串 | `(value: string) => void` | - |
| getRef | 获取内部 antd `InputRef` 的回调 | `(ref: InputRef \| null) => void` | - |
| en | 是否英文模式，开启后不受 `maxLength` 限制 | `boolean` | `false` |
| word | 是否为字数/单词相关模式 | `boolean` | - |
| tooltip | 透传给外层 `Tooltip` 的配置 | `TooltipProps` | - |
| escapeCharacters | 需要自动转义/去转义的字符列表 | `string[]` | - |

> 另提供子组件：`Input.Search`、`Input.TextArea`、`Input.Password`、`Input.Number`（数字输入，`onChange` 返回字符串）、`Input.Range`（范围输入）。
