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
