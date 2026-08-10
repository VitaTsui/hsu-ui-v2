import React from "react";

// Only components hsu-ui does not provide fall back to antd; Button comes from hsu-ui
import { Avatar, Layout, Popover, Segmented, Space } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import classNames from "classnames";

import styles from "./index.module.scss";

import { observer } from "mobx-react-lite";

import Breadcrumb from "../Breadcrumb";
import Menu, { MenuType } from "../Menu";
import ThemeStore from "../Theme/ThemeStore";
import I18nStore from "../I18n/I18nStore";
// 用户信息由 App 传进来。这里原本是 `import { getUserInfo } from "@/utils/auth"` ——
// 那是消费方自己的鉴权模块，组件不该认识它。改成 props 之后本组件只关心「显示什么名字」。

/**
 * 账号动作（改密 / 退出）由 App 传进来，本组件只认这个形状、不认来源。
 *
 * 别把 `PwdChange` 或 `LoginStore` 搬进来——看着它们该跟用户菜单待在一起，
 * 但会同时踩两条：
 *   1. `layout/` 反向 import `@/pages/…`（共享层依赖页面私有目录）；
 *   2. `PwdChange` 用 `FormItem`，而 `FormItem` 静态引入全部字段渲染器
 *      （wangeditor / codemirror / pdfjs / xlsx）。它现在由 App 以 `lazy()`
 *      ＋「打开才挂载」持有，搬进来很容易顺手写成静态 import，那些库就又钉回首屏了。
 */
export interface AccountAction {
  title: string;
  icon: string;
  onclick: () => void;
  /** 危险动作（退出登录之类），悬浮态用红色区分 */
  danger?: boolean;
}

export interface HeaderProps {
  router: Parameters<typeof Breadcrumb>[0]["router"];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** mixed 布局下把顶部菜单的子项回传给左侧栏 */
  onChildItems: (items: MenuType[]) => void;
  menu: AccountAction[];
  /** 当前用户，用于右上角展示。不传则不显示用户名 */
  user?: { nickname?: string; avatar?: string };
  /** 站点标题。原本读的是应用的全局 Config，组件不该认识那个 */
  title?: React.ReactNode;
  /** 侧栏收起时用的短标题；不传则回落到 title */
  smallTitle?: React.ReactNode;
  /**
   * 是否显示语言切换。
   *
   * 只有中文一种文案的项目把它关掉——留着会给用户一个切了之后只有 antd 内建文案变化、
   * 业务文案纹丝不动的开关，比没有更糟。关掉后 `Layout.I18n` 仍可照常用（日期、分页
   * 这些 antd 内建文案还是要它）。
   */
  showLocale?: boolean;
}

const Header: React.FC<HeaderProps> = observer((props) => {
  const {
    router,
    collapsed,
    onToggleCollapsed,
    onChildItems,
    menu,
    user,
    title,
    smallTitle,
    showLocale = true,
  } = props;
  const { layout, headerTheme, appearance, setAppearance } = ThemeStore;
  const { locale, setLocale } = I18nStore;

  // Appearance + language are grouped into the user dropdown; bilingual labels follow the current language
  const isEn = locale === "en-US";
  const appearanceOptions = [
    { label: isEn ? "Light" : "浅色", value: "light" },
    { label: isEn ? "Dark" : "深色", value: "dark" },
    { label: isEn ? "System" : "跟随", value: "system" },
  ];
  const languageOptions = [
    { label: "中文", value: "zh-CN" },
    { label: "English", value: "en-US" },
  ];

  // Nav (header/sidebar) light/dark: light -> light, dark/theme-colored -> dark
  const navTheme: "light" | "dark" = headerTheme === "light" ? "light" : "dark";

  const nickname = user?.nickname;

  return (
    <Layout.Header className={classNames(styles.header, styles[headerTheme])}>
      <div className={styles.headerLeft}>
        {/* Title */}
        {["left", "mixed"].includes(layout) ? (
          <div
            className={classNames(styles.title, {
              [styles.titleCollapsed]: collapsed,
            })}
          >
            {collapsed ? smallTitle ?? title : title}
          </div>
        ) : (
          <div className={classNames(styles.title, styles.titleTop)}>
            {title}
          </div>
        )}

        {/* Collapse button */}
        {["left", "mixed"].includes(layout) && (
          <Button
            className={styles.collapsed}
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleCollapsed}
          />
        )}

        {/* Breadcrumb */}
        {["left"].includes(layout) && (
          <Breadcrumb router={router} className={styles.breadcrumb} />
        )}

        {/* Top menu */}
        {["top", "mixed"].includes(layout) && (
          <Menu
            router={router}
            mode="horizontal"
            theme={navTheme}
            onlyLvOneMenu={layout === "mixed"}
            getCurrChildItems={onChildItems}
          />
        )}
      </div>
      <div className={styles.headerRight}>
        {/* User info (appearance + language + account actions, all grouped in this dropdown) */}
        <Popover
          classNames={{ root: styles.userPopover }}
          placement="bottomRight"
          content={
            <div className={styles.userMenuPanel}>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>
                  {isEn ? "Appearance" : "外观"}
                </span>
                <Segmented
                  size="small"
                  value={appearance}
                  options={appearanceOptions}
                  onChange={(v) => setAppearance(v as typeof appearance)}
                />
              </div>
              {showLocale && (
                <div className={styles.settingRow}>
                  <span className={styles.settingLabel}>
                    {isEn ? "Language" : "语言"}
                  </span>
                  <Segmented
                    size="small"
                    value={locale}
                    options={languageOptions}
                    onChange={(v) => setLocale(v as string)}
                  />
                </div>
              )}

              <div className={styles.settingDivider} />

              <div className={styles.menu}>
                {menu?.map((item, index) => (
                  <Button
                    key={index}
                    className={classNames({
                      [styles.menuBtnDanger]: item.danger,
                    })}
                    icon={<Icon icon={item.icon} />}
                    onClick={item.onclick}
                    type="text"
                  >
                    {item.title}
                  </Button>
                ))}
              </div>
            </div>
          }
        >
          <Space className={styles.user}>
            <Avatar
              style={{ backgroundColor: "#1677ff", verticalAlign: "middle" }}
              icon={nickname ? undefined : <UserOutlined />}
            >
              {nickname?.[0]?.toUpperCase()}
            </Avatar>
            {nickname}
          </Space>
        </Popover>
      </div>
    </Layout.Header>
  );
});

export default Header;
