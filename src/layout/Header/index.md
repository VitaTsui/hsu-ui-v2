---
title: Header 顶栏
order: 1
---

# Header 顶栏

站点标题、面包屑、语言与外观切换、账号菜单。

## 引入

布局组件走**子路径**引入：

```ts
import Layout from "@hsu-react/ui/es/layout";
import type { RouteType } from "@hsu-react/ui/es/layout";
```

## 与路由的关系

`Menu`、`Breadcrumb`、`NavTabBar` 都是**路由驱动**的：它们从一份 `RouteType[]` 里读展示信息，并用 react-router 的 `useLocation` / `useNavigate` 决定当前位置与跳转。因此：

- **`react-router` 与 `react-intl` 是可选 peerDependency** —— 只用 `Button`、`Table` 这些的项目完全不受影响，用到 `Layout.*` 的项目才需要装
- 正因为可选，布局**不从包根导出**。如果 `import { Button } from "@hsu-react/ui"` 也会连带解析 react-router，没装的项目会直接构建失败，"可选" 就没意义了
- 组件必须渲染在 `<BrowserRouter>` 之类的 Router 上下文里

`RouteType` 就是 react-router 的 `RouteObject` 加了一个 `meta`，通常你现有的路由配置不用改：

```ts | pure
export interface MetaType {
  // 布局组件会读的
  name?: string;          // 菜单项、面包屑、页签上显示的文案
  menu?: boolean;         // true 才进菜单；不写 = 可访问但不在菜单里（详情页这类）
  icon?: ReactNode;
  activeIcon?: ReactNode; // 选中态图标，不传则沿用 icon
  disabled?: boolean;
  affix?: boolean;        // 固定页签，不可关闭
  noTabsView?: boolean;   // 不进页签栏
  secondary?: boolean;    // 二级导航

  // 布局组件不读，只是搭车放在同一份配置里，由消费方自己消费
  title?: string;         // 页面标题，写 document.title 之类
  noCache?: boolean;      // 不做页面缓存（消费方决定是否包 KeepAlive）
  noLazy?: boolean;       // 不走懒加载
  noAuth?: boolean;       // 无需登录（消费方的鉴权守卫用）
  hasPermi?: string[];    // 权限码（消费方生成路由时过滤）
}

export type RouteType = { children?: RouteType[]; meta?: MetaType } & RouteObject;
```

## 典型装配

```tsx | pure
import { ConfigProvider } from "@hsu-react/ui";
import Layout from "@hsu-react/ui/es/layout";

<ConfigProvider permissions={perms} request={{ get, post, del, put }}>
  <Layout.I18n defaultLocale="zh-CN">
    <Layout.Theme>
      <BrowserRouter>
        <Layout.Header
          router={router}
          title="控制台"
          smallTitle="台"
          user={{ nickname }}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          onChildItems={setChildItems}
          menu={accountActions}
        />
        <Layout.Menu router={router} collapsed={collapsed} />
        <Layout.NavTabBar router={router} />
      </BrowserRouter>
    </Layout.Theme>
  </Layout.I18n>
</ConfigProvider>;
```

顺序上，`ConfigProvider` 在最外层（它提供令牌与 antd 主题），`Layout.Theme` 在内层（它只管外观三态与侧栏配色，不重复做全局主题）。

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| router | 路由配置，用于渲染面包屑与顶部菜单 | `RouteType[]` | - |
| title | 站点标题 | `ReactNode` | - |
| smallTitle | 侧栏收起时的短标题；不传回落到 `title` | `ReactNode` | - |
| user | 当前用户，用于右上角展示 | `{ nickname?: string; avatar?: string }` | - |
| collapsed | 侧栏是否收起 | `boolean` | - |
| onToggleCollapsed | 点击收起按钮 | `() => void` | - |
| onChildItems | mixed 布局下把顶部菜单的子项回传给左侧栏 | `(items: MenuType[]) => void` | - |
| menu | 账号下拉里的动作项（改密、退出等） | `AccountAction[]` | - |

> `user` 与 `title` 原本分别读应用的鉴权模块与全局 `Config`，移入库时改成了属性 —— 组件不该认识消费方的这两样东西。
