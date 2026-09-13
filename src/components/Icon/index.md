---
nav: 组件
group:
  title: 通用
  order: 1
title: Icon 图标
---

# Icon 图标

统一图标入口：传入 antd 图标名（如 `UserOutlined`）走 `@ant-design/icons`，传入 iconify 名（如 `ph:user-bold`）走 `@iconify/react`。

## 图标从哪儿来（离线/内网必读）

`@iconify/react` 的规矩是：**注册过的图标名走本地，没注册过的去 `api.iconify.design` 现拉**。拉不到就是一片空白，**而且不报错** —— 断网、内网、CSP 收紧的环境下这个坑只能靠肉眼发现。

所以分两笔账：

- **本库自己用到的图标**（`Select` 的下拉箭头、`Table` 翻页、`Copy`、`Tree` 搜索、`Chat` …… 共 46 枚）：**库已经自己注册好了**，永远走本地、零请求。消费方什么都不用做，子路径按需引入同样成立。数据由 `scripts/gen-icon-data.cjs` 从源码反扫生成，只裁用到的那几十枚（约 9 KB gzip）。
- **你自己代码里写的 iconify 名**：仍然要你自己 `addCollection` 注册。忘了注册时，开发环境下 `Icon` 会在控制台打一条警告点名是哪个图标，别忽略它。

```ts
import { addCollection } from "@iconify/react";
import ph from "@iconify/json/json/ph.json";

addCollection(ph); // 整集 4.3 MB，生产环境建议只裁用到的那几枚
```

## 引入

```ts
import { Icon } from "@hsu-react/ui";
```

## antd 图标

antd 图标名（驼峰）：

```tsx
import React from "react";
import { Icon } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 22 }}>
    <Icon icon="UserOutlined" />
    <Icon icon="SettingOutlined" />
    <Icon icon="HomeOutlined" />
    <Icon icon="HeartFilled" style={{ color: "#eb2f96" }} />
  </div>
);
```

## iconify 图标

iconify 图标名（`集合:名称`，本库之外的图标需自行注册对应图标集）：

```tsx
import React from "react";
import { Icon } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 22 }}>
    <Icon icon="ph:user-bold" />
    <Icon icon="mdi:home" />
    <Icon icon="tabler:settings" />
    <Icon icon="solar:heart-bold" style={{ color: "#eb2f96" }} />
    <Icon icon="carbon:document" />
  </div>
);
```

## API

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| icon | 图标名：antd 图标名 或 iconify 名 | `string` |
| iconProps | 透传给 iconify 的属性 | `object` |

继承原生 `span` 属性（`className` / `style` / `onClick` 等）。
