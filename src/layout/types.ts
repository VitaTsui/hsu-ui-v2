import type { ReactNode } from "react";
import type { RouteObject } from "react-router";

/**
 * 路由的附加信息。菜单、面包屑、页签这三个组件都从这里取展示所需的一切 ——
 * 它们不认识业务，只认识这个形状。
 */
export interface MetaType {
  /** 页面标题，用于菜单项、面包屑与页签 */
  title?: string;
  /** 唯一名称 */
  name?: string;
  /** 是否作为菜单项展示。为 false 时该路由仍可访问，只是不出现在菜单里 */
  menu?: boolean;
  icon?: ReactNode;
  /** 选中态图标；不传则沿用 `icon` */
  activeIcon?: ReactNode;
  disabled?: boolean;
  /** 固定页签，不可关闭 */
  affix?: boolean;
  /** 不进入页签栏 */
  noTabsView?: boolean;
  /** 不做页面缓存（react-activation） */
  noCache?: boolean;
  noLazy?: boolean;
  /** 无需登录即可访问 */
  noAuth?: boolean;
  /** 权限码；配合 ConfigProvider.permissions 决定该菜单项是否展示 */
  hasPermi?: string[];
  /** 二级导航（配合 Menu 的 SecondaryHeader） */
  secondary?: boolean;
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
