---
nav: 组件
group:
  title: 数据录入
  order: 3
title: SecondConf 二次确认
---

# SecondConf 二次确认

基于 `Modal` 封装的二次确认弹窗，内置问号图标，自动拼接「确认{contentTitle}吗？」标题与说明文案。

## 引入

```ts
import { SecondConf } from "@hsu-react/ui";
```

## 二次确认

```tsx
import React, { useState } from "react";
import { SecondConf } from "@hsu-react/ui";
import { Button } from "antd";

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button danger onClick={() => setOpen(true)}>
        删除
      </Button>
      <SecondConf
        open={open}
        contentTitle="删除该条数据"
        contentText="删除后将无法恢复，请谨慎操作。"
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};
```

## 触发器模式（推荐）

传入 `children` 作为触发元素，并且**不传 `open`**，弹窗自持开关状态，调用处原地包一层即可，不必为每个可确认的操作各存一份 `open`。

列表里尤其明显：`map()` 内部无法为每一行单独 `useState`，受控写法只能把「当前待确认的是哪一行」提到循环外，触发点和弹窗被拆到两个作用域；触发器模式没有这个问题。

```tsx
import React from "react";
import { SecondConf } from "@hsu-react/ui";
import { Button } from "antd";

const list = [
  { id: "1", name: "西游记" },
  { id: "2", name: "水浒传" },
];

export default () => (
  <>
    {list.map((it) => (
      <SecondConf
        key={it.id}
        contentTitle={`删除《${it.name}》`}
        contentText="删除后将无法恢复，请谨慎操作。"
        okButtonProps={{ danger: true }}
        onOk={() => console.log("deleted", it.id)}
      >
        <Button danger size="small" style={{ marginRight: 8 }}>
          删除 {it.name}
        </Button>
      </SecondConf>
    ))}
  </>
);
```

触发元素自身的 `onClick` 会照常先执行；点击会 `stopPropagation`，避免嵌在可点击的行/卡片里时连带触发整行的点击。

同时传 `open` 和 `children` 时以受控为准，此时 `children` 只作为触发元素渲染，开关由外部决定。

## API

在 `Modal`（即 antd `ModalProps`）基础上扩展（`title` 已被内部接管）：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| contentTitle | 标题中「确认 … 吗？」的中间内容 | `ReactNode` | - |
| contentText | 标题下方的补充说明文案 | `ReactNode` | - |
| children | 触发元素；不传 `open` 时弹窗自持开关状态 | `ReactElement` | - |

> 其余属性（`open`、`onOk`、`onCancel`、`width`、`confirmLoading` 等）与 `Modal` 一致；组件内部默认 `width={800}`、`centered`、`maskClosable={false}`、`mask={false}`。
>
> `open` 传了就是受控（含 `undefined` 以外的任何值），`onOk` / `onCancel` 里需自行关闭；不传则由组件自行开关，`onOk` 只写业务动作即可。
