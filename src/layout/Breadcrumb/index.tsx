import { Breadcrumb as AntBreadcrumb } from "antd";
import React, { ReactNode, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";

import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { RouteType } from "../types";
import styles from "./index.module.scss";
import { cloneDeep } from "lodash";
import classNames from "classnames";
import { formatRoutes } from "./_utils/formatRoutes";
import { formatBreadcrumbMenu } from "./_utils/formatMenu";
import { useBreadcrumbPath } from "./_hooks/useBreadcrumbPath";
import BreadcrumbItemIcon from "./_components/BreadcrumbItemIcon";

// Omit 掉 children：antd v6 把 BreadcrumbItemType.children 收窄成了
// `Omit<BreadcrumbItemType, "children">[]`，而这里的 children 要能递归携带 parent / route
// 这些自有字段，直接 extends 会判为不兼容。渲染时再转回 antd 认识的形状。
export interface BreadcrumbType extends Omit<ItemType, "children"> {
  children?: BreadcrumbType[];
  icon?: ReactNode;
  parent?: RouteType;
  route?: RouteType;
  index?: boolean;
}

interface BreadcrumbProps {
  router: RouteType[];
  className?: string;
}

/**
 * Breadcrumb component
 */
const Breadcrumb: React.FC<BreadcrumbProps> = (props) => {
  const { router, className } = props;
  const navigate = useNavigate();

  const _routes = useMemo(() => {
    return formatRoutes(router);
  }, [router]);

  const breadcrumb = useBreadcrumbPath(_routes);

  /**
   * Handle the breadcrumb item click event
   */
  const handleItemClick = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  /**
   * Format breadcrumb items
   */
  const formattedItems = useMemo(() => {
    return cloneDeep(breadcrumb)?.map((item, index) => {
      const isLastItem = index === breadcrumb.length - 1;
      const children = item.children?.filter((i) => !i.path?.includes(":"));
      const hasChildren = children && children.length > 0;

      // If there are child menus, set the menu items
      if (hasChildren) {
        item.onClick = (e) => e.preventDefault();
        item.menu = {
          items: formatBreadcrumbMenu(cloneDeep(children), navigate),
        };
      }

      // The last item does not show a path
      if (isLastItem) {
        item.path = undefined;
      }

      // If there is an icon, wrap the title
      if (item.icon) {
        item.title = <BreadcrumbItemIcon icon={item.icon} title={item.title} />;
      }

      // If there is a path and no child menu, set the click handler
      if (item.path && !hasChildren) {
        item.onClick = (e) => {
          e.preventDefault();
          handleItemClick(item.path as string);
        };
      }

      return { ...item };
    });
  }, [breadcrumb, navigate, handleItemClick]);

  return (
    <AntBreadcrumb
      className={classNames(styles.Breadcrumb, className)}
      // BreadcrumbType 比 antd 的 ItemType 多带了 parent / route / children 这些自有字段，
      // 供上面的格式化与点击逻辑使用；渲染时 antd 只读它认识的那几个，多出来的会被忽略。
      items={formattedItems as ItemType[]}
    />
  );
};

export default Breadcrumb;
