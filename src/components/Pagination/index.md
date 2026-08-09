---
nav: 组件
group:
  title: 数据展示
  order: 4
title: Pagination 分页
---

# Pagination 分页

在 antd `Pagination` 之上封装：`pageSizeOptions` 收成数字数组、页数与每页条数可以完全不受控、外加一套用于「不知道总数」场景的简洁模式。

1.0.0 起从 `Table` 内部提升为公开组件 —— `Table` 的内置分页用的就是它。

## 引入

```ts
import { Pagination } from "@hsu-react/ui";
```

## 基本用法

`current` / `pageSize` 都不传时组件自己维护状态，翻页立即生效；传了就以外部值为准（受控）。

```tsx
import React from "react";
import { Pagination } from "@hsu-react/ui";

export default () => (
  <Pagination
    total={185}
    pageSize={10}
    pageSizeOptions={[10, 20, 50]}
    showSizeChanger
    showTotal={(total) => `共 ${total} 条`}
  />
);
```

## 带边框

`bordered` 给分页加一圈边框与内边距，适合直接贴在列表下方、和上方内容有分隔的场景。

```tsx
import React from "react";
import { Pagination } from "@hsu-react/ui";

export default () => (
  <Pagination bordered total={185} pageSize={10} align="end" />
);
```

## 简洁模式

`simple` 不是 antd 那个简洁模式，而是一套**不依赖 total** 的上一页 / 下一页：接口只返回当前页数据、拿不到总数时用它。

此时必须传 `listLength`（当前页拿到几条）—— 「下一页」是否可点靠它判断：拿到的条数少于 `pageSize` 就说明到底了。

```tsx
import React, { useState } from "react";
import { Pagination } from "@hsu-react/ui";

export default () => {
  const [size, setSize] = useState(10);
  // 假设第 3 页只返回了 4 条，说明已经到底
  const [len, setLen] = useState(10);

  return (
    <Pagination
      simple
      showSizeChanger
      pageSize={size}
      pageSizeOptions={[10, 20]}
      listLength={len}
      showTotal={() => "已加载"}
      onChange={(page, pageSize) => {
        setSize(pageSize);
        setLen(page >= 3 ? 4 : pageSize);
      }}
    />
  );
};
```

## API

在 [antd PaginationProps](https://ant.design/components/pagination-cn) 基础上重写 / 新增：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| pageSizeOptions | 每页条数选项。**类型收成了数字数组**（antd 是 `string[]`）；当前 `pageSize` 不在其中时会自动并入并排序 | `number[]` | `[]` |
| bordered | 加边框与内边距 | `boolean` | `false` |
| simple | 简洁模式：只有上一页 / 下一页，不需要 `total` | `boolean` | `false` |
| listLength | 当前页实际拿到的条数，**simple 模式必传**，用于判断「下一页」是否可点 | `number` | - |
| showTotal | 同 antd，另外允许传 `false` 显式关掉 | `false \| ((total, range) => ReactNode)` | - |

> 其余属性透传给 antd `Pagination`。
>
> `PaginationProps` 上还有一个 `onStaticPaginationChange`，它**只在 `Table` 里生效** —— `Table` 用 `staticDataSource` 做前端分页时，用它把页码变化透给外部。类型挂在这里是因为 `Table` 的 `pagination` 属性直接复用了这个接口，单独给 `<Pagination>` 传不会有任何效果。

## 受控与非受控

这是最容易踩的一点：

- **都不传** `current` / `pageSize` —— 组件内部维护，点了就翻，你只需要在 `onChange` 里去取数据
- **只传其一** —— 传的那个受控，另一个仍由内部维护
- **传了就必须更新它**：`current` 传了但 `onChange` 里没有把它改掉，页码会翻不动。这和 antd 的行为一致，只是本组件在不传时多给了一层内部状态，容易让人以为「传了也能自己翻」
