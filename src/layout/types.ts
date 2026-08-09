import type { ReactNode } from "react";
import type { RouteObject } from "react-router";

/**
 * 路由的附加信息。菜单、面包屑、页签这三个组件都从这里取展示所需的一切 ——
 * 它们不认识业务，只认识这个形状。
 *
 * 字段分两类，下面用分组标出：**布局组件真正会读的**，以及**只是搭车放在这里、由消费方
 * 自己消费的**。后者原样保留是因为它们本来就写在同一份路由配置里（鉴权守卫、KeepAlive
 * 包装、懒加载装配各取所需），把它们从类型里删掉只会逼消费方再声明一次。
 */
export interface MetaType {
  // —— 布局组件会读的 ——

  /** 菜单项 / 面包屑 / 页签上显示的文案 */
  name?: string;
  /**
   * 是否作为菜单项展示。注意是**显式开启**：只有为 `true` 的路由才会进 Menu，
   * 不写等同于不进菜单（但路由本身照常可访问）。
   */
  menu?: boolean;
  icon?: ReactNode;
  /** 选中态图标；不传则沿用 `icon`。只对没有子项的菜单项生效 */
  activeIcon?: ReactNode;
  /** 菜单项置灰不可点 */
  disabled?: boolean;
  /** 固定页签，不可关闭，也不会被「关闭其他 / 关闭右侧」清掉 */
  affix?: boolean;
  /** 不进入页签栏 */
  noTabsView?: boolean;
  /** 二级导航：该路由的子级换到次级菜单里展示（配合 Menu 的 secondaryHeader） */
  secondary?: boolean;

  // —— 布局组件不读，留给消费方 ——

  /** 页面标题，供消费方写 document.title 等用途 */
  title?: string;
  /** 不做页面缓存，供消费方决定是否用 react-activation 的 KeepAlive 包裹 */
  noCache?: boolean;
  /** 不走懒加载，供消费方装配路由时判断 */
  noLazy?: boolean;
  /** 无需登录即可访问，供消费方的鉴权守卫判断 */
  noAuth?: boolean;
  /** 权限码，供消费方在生成路由时用 usePermissions / ConfigProvider.permissions 过滤 */
  hasPermi?: string[];
}

/**
 * 路由配置。在 react-router 的 `RouteObject` 上加了 `meta`。
 *
 * 这个类型原本定义在消费方的 `@/router/router.config` 里，布局组件反过来 import 它 ——
 * 那样组件就绑死在某个具体应用上了。收进库里之后，消费方改为让自己的路由配置符合这个
 * 形状（`RouteObject` 本来就是 react-router 的标准类型，通常不用改任何东西）。
 */
export type RouteType = {
  children?: RouteType[];
  meta?: MetaType;
} & RouteObject;
