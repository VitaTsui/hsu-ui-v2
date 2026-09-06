---
title: Menu 菜单
order: 2
---

# Menu 菜单

从路由配置生成侧边 / 顶部菜单，自带选中态跟随、权限过滤与二级菜单。

## 引入

```ts
import Layout from "@hsu-react/ui/es/layout";

<Layout.Menu router={router} collapsed={collapsed} />;
```

## 说明

菜单项由 `RouteType[]` 推导，规则：

- **`meta.menu` 是显式开关**：只有 `meta.menu` 为真的路由才生成菜单项。不写等同于不进菜单 —— 路由本身照常可访问，详情页这类不需要额外标记
- 文案取 `meta.name`，图标取 `meta.icon`；`meta.activeIcon` 是选中态图标，不传则沿用 `icon`（只对没有子项的菜单项生效）
- `meta.disabled` 置灰不可点
- 选中态按当前 `location.pathname` 匹配，深层路由会自动点亮其所属的菜单项

`meta` 上还有 `hasPermi`、`noAuth` 这些字段，**本组件不读**，它们由消费方在生成路由时自行消费（例如按权限先裁剪一遍 `router` 再传进来）。

`meta.secondary` 标记的路由进入**二级菜单**：主菜单只显示到一级，点进去之后左侧换成该模块的次级菜单，顶部可用 `secondaryHeader` 放返回入口、标题或检索框。

### 滚动与滚动条

`inline` 模式下本组件**自带滚动容器**：外层包一个撑满高度、自己不滚的宿主，菜单根 `overflow-y: auto` 负责滚。
所以把 `Menu` 塞进任何一个**有确定高度**的容器（antd 的 `Layout.Sider`、或自己的 div）即可，不需要再补 `overflow` 规则；
展开 / 收起子菜单的动画期间也不会有滚动条闪出来。宿主没有确定高度时菜单会被撑开、退回由页面滚，这时请给宿主一个高度。

滚动条的**外观（显 / 隐 / 配色）本组件不管**，交给消费方的全局样式（`::-webkit-scrollbar` 那一套）。
组件里刻意不写 `scrollbar-width` / `scrollbar-color`：**Chrome 121+ 一旦读到它们的非默认值，就会整套忽略该元素上的
`::-webkit-scrollbar` 规则**，库里无差别写一句就会悄悄废掉消费方全站的滚动条皮肤。库内其它地方若确实需要这两个属性，
必须锁在 `@supports (-moz-appearance: none)` 里，只给 Firefox 看。

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| router | 路由配置 | `RouteType[]` | - |
| collapsed | 是否收起（只显示图标） | `boolean` | `false` |
| menuItems | 直接指定菜单项，跳过从 router 推导 | `MenuType[]` | - |
| onlyLvOneMenu | 只渲染一级菜单（mixed 布局的顶部菜单用） | `boolean` | `false` |
| getCurrChildItems | 回传当前一级菜单的子项，供外部渲染 | `(children: MenuType[]) => void` | - |
| secondaryHeader | 次级菜单顶部的自定义区域 | `ReactNode` | - |
| secondaryItemFilter | 次级菜单项的额外过滤，按 key（绝对路径）判断 | `(key: string) => boolean` | - |

> 其余属性透传给 antd 的 [Menu](https://ant.design/components/menu-cn)。

### 自定义次级菜单头部

不传 `secondaryHeader` 时组件会渲染一个默认头部（返回入口 ＋ 当前实体名）。要在它上面加东西
——比如详情内检索框——不用整块重写，把 `SecondaryHeader` 拿出来用它的 `extra` 插槽：

```tsx | pure
import Layout, { SecondaryHeader } from "@hsu-react/ui/es/layout";

<Layout.Menu
  router={router}
  secondaryHeader={
    <SecondaryHeader
      collapsed={collapsed}
      theme="dark"
      title={work.name}
      extra={<SearchInWork workId={work.id} />}
    />
  }
/>;
```

| SecondaryHeader 属性 | 说明 | 类型 |
| --- | --- | --- |
| collapsed | 侧栏是否收起，收起时只剩箭头 | `boolean` |
| theme | 明暗，跟随侧栏 | `"light" \| "dark"` |
| backText | 返回入口文案 | `string` |
| onBack | 自定义返回行为，不给则退回上一页 | `() => void` |
| title | 当前实体名 | `string` |
| extra | 返回入口与标题之间的插槽 | `ReactNode` |
