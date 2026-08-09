---
title: Breadcrumb 面包屑
order: 3
---

# Breadcrumb 面包屑

从路由配置推导当前位置的层级路径，父级带下拉菜单可直接跳转到同级页面。

## 引入

布局组件走**子路径**引入（原因见 [与路由的关系](/layouts/header#与路由的关系)）：

```ts
import Layout from "@hsu-react/ui/es/layout";

<Layout.Breadcrumb router={router} />;
```

## 说明

`router` 传的就是应用的路由配置（`RouteType[]`）。组件会：

- 按当前 `location.pathname` 逐级匹配出路径链
- 用每级的 `meta.name` 作为文案、`meta.icon` 作为图标
- 父级若有多个子路由，渲染成下拉菜单，点击直接跳转

面包屑比菜单**宽松**：只要 `meta.menu` 为真、**或者** `meta.noTabsView` 不为真，该层就会出现在路径链里。所以「不进菜单但能访问」的详情页照样有面包屑，只有显式标了 `noTabsView` 且没开 `menu` 的路由才会被跳过（它的子级会顶上来）。

带路径参数的子路由（`path` 里含 `:`）不会进下拉菜单 —— 没有具体参数值，跳过去也没有意义。

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| router | 路由配置 | `RouteType[]` | - |
| className | 自定义类名 | `string` | - |
