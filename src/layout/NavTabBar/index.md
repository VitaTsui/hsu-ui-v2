---
title: NavTabBar 页签栏
order: 4
---

# NavTabBar 页签栏

多页签导航：可拖拽排序、右键菜单（关闭其他 / 关闭右侧 / 刷新）、固定页签、页面缓存。

## 引入

```ts
import Layout from "@hsu-react/ui/es/layout";

<Layout.NavTabBar router={router} />;
```

## 用法

页签栏最前面是「刷新当前页」按钮，右键页签可以关闭 / 批量关闭 / 重新加载，页签之间可以拖拽排序。

```tsx | pure
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AliveScope } from "react-activation";
import Layout from "@hsu-react/ui/es/layout";

const router = [
  { path: "/home", meta: { name: "首页", menu: true, affix: true } },
  { path: "/order", meta: { name: "订单管理", menu: true } },
  { path: "/user", meta: { name: "用户列表", menu: true } },
];

export default () => (
  <AliveScope>
    <BrowserRouter>
      <Layout.NavTabBar router={router} />
    </BrowserRouter>
  </AliveScope>
);
```

> 「首页」标了 `meta.affix`，所以没有关闭按钮。
>
> 这里只给代码不给可运行示例：页签栏要接管地址栏，而文档站本身也跑在一个 react-router 里，
> 嵌一层 Router 会直接报错（react-router 不允许嵌套），不嵌又会让示例真的把文档站导走。

## 说明

页签由访问过的路由累积而来，文案取 `meta.name`、图标取 `meta.icon`。两个开关直接影响这里：

- `meta.noTabsView` —— 该路由不进页签栏（它的子路由会顶上来）
- `meta.affix` —— 固定页签，不显示关闭按钮，也不会被「关闭其他 / 关闭右侧」清掉

页签的关闭与刷新走 [react-activation](https://github.com/CJY0208/react-activation) 的 `useAliveController`，因此消费方需要把路由出口包在 `<AliveScope>` 里、页面组件包 `<KeepAlive>`，关闭 / 刷新才能真正丢弃并重建对应的组件树。要让某个页面不缓存，在消费方装配路由时按 `meta.noCache` 跳过 `KeepAlive` 即可 —— 这个字段本组件不读。

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| router | 路由配置 | `RouteType[]` | - |
| affixRouter | 额外固定的路由路径（等价于给这些路由加 `meta.affix`） | `string[]` | `[]` |
| basePath | 关掉最后一个页签后回退到的路径 | `string` | `"/"` |
| showReload | 页签栏最前面的「刷新当前页」按钮 | `boolean` | `true` |

## 配套 Hook

页签的标题与生命周期需要页面内部参与时，用这三个 hook（都从 `@hsu-react/ui/es/layout` 具名导出）：

| Hook | 用途 |
| --- | --- |
| `useSetTabTitle()` | 返回 `(key, title) => void`。详情页想把页签标题改成「订单 #123」这类动态文案时用它 |
| `useReload()` | 返回 `(id) => void`。触发某个页面重新挂载，右键菜单的「刷新」走的就是它 |
| `useDropTab()` | 返回 `(key) => void`。业务里主动关掉某个页签，例如表单提交成功后关闭自己并跳回列表 |

三者都依赖 `NavTabBar` 挂载时提供的 context，因此只能在页签体系内部的页面里调用。
