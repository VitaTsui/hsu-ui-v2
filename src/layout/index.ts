/**
 * 中后台布局组件。
 *
 * 这几个组件是路由驱动的：菜单、面包屑、页签都从一份 `RouteType[]` 里读展示信息，并用
 * react-router 的 `useLocation` / `useNavigate` 决定当前位置与跳转。因此 **`react-router`
 * 与 `react-intl` 是可选 peerDependency** —— 只用 Button、Table 这些的项目完全不受影响，
 * 用到 `Layout.*` 的项目才需要装。
 *
 * 与本库其余部分的分工：主题、色板、圆角这些由 `ConfigProvider` 统一提供，`Layout.Theme`
 * 只负责外观三态（light / dark / 跟随系统）与侧栏导航的专属配色。
 */
import Breadcrumb from "./Breadcrumb";
import Header from "./Header";
import I18n from "./I18n";
import Menu from "./Menu";
import NavTabBar from "./NavTabBar";
import Theme from "./Theme";

import I18nStore from "./I18n/I18nStore";
import ThemeStore from "./Theme/ThemeStore";

export type { RouteType, MetaType } from "./types";

/**
 * 各组件的公开类型。第一个真实消费方（vita-admin-starter）一上来就需要 `AccountAction`
 * 与 `MenuType` —— 前者用来声明账号菜单，后者用来存 mixed 布局回传的子项。它们原本只在
 * 各自模块里导出，消费方只能写 `@hsu-react/ui/es/layout/Header` 这种深路径，等于把内部
 * 目录结构变成公开契约。统一从这里出。
 */
export type { AccountAction, HeaderProps } from "./Header";
export type { MenuType, MenuProps } from "./Menu";
/**
 * 次级菜单的默认头部。`Menu` 在切到次级菜单时会自己渲染它，一般不用管；
 * 需要在返回入口下面塞点东西（详情内检索框之类）时，把它的 `extra` 用起来、
 * 整块作为 `secondaryHeader` 传给 `Menu`。
 */
export { default as SecondaryHeader } from "./Menu/_components/SecondaryHeader";
export type { SecondaryHeaderProps } from "./Menu/_components/SecondaryHeader";
export type { TabType, NavTabBarProps } from "./NavTabBar";
export type { BreadcrumbType, BreadcrumbProps } from "./Breadcrumb";
export type { InternationalizationProps } from "./I18n";
export type { ThemeProps } from "./Theme";

export { default as useSetTabTitle, NavTabBarTitleContent } from "./_hooks/useSetTabTitle";
export { default as useReload, ReloadContent } from "./_hooks/useReload";
export { default as useDropTab, NavTabBarContent } from "./_hooks/useDropTab";

/**
 * 显式标注这个命名空间的类型，而不是让 TS 去推断。
 *
 * 推断会把两类东西泄进 d.ts：mobx store 的私有字段（TS4094），以及各组件的 Props 类型 ——
 * 那些没有被导出，消费方那边无法解析（TS4023）。react-intl 的内部依赖同理（TS2742）。
 * 这些都只在开了 declaration 的发包构建里才会暴露，本地跑 dev 看不出来。
 */
interface LayoutNamespace {
  Header: typeof Header;
  Menu: typeof Menu;
  Breadcrumb: typeof Breadcrumb;
  NavTabBar: typeof NavTabBar;
  Theme: typeof Theme;
  I18n: typeof I18n;
  ThemeStore: typeof ThemeStore;
  I18nStore: typeof I18nStore;
}

const Layout: LayoutNamespace = {
  /** 顶栏：标题、面包屑、语言与外观切换、账号菜单 */
  Header,
  /** 侧边 / 顶部菜单 */
  Menu,
  /** 面包屑 */
  Breadcrumb,
  /** 多页签栏（可拖拽排序、右键菜单） */
  NavTabBar,
  /** 外观三态与布局配色 */
  Theme,
  /** react-intl provider + antd locale */
  I18n,
  /** 外观状态（mobx），供应用侧读写 appearance */
  ThemeStore,
  /** 语言状态（mobx），供应用侧读写 locale */
  I18nStore,
};

export default Layout;
