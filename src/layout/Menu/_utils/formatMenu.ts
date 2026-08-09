import { cloneDeep } from "lodash";
import { RouteType } from "../../types";
import { MenuType } from "..";

/**
 * Format routes into menu items
 * @param routes Route config
 * @param all Whether to include all routes (including those not shown in the menu)
 * @param parent Parent menu item
 * @returns Menu item array
 */
export const formatMenu = (
  routes: RouteType[],
  all: boolean = false,
  parent?: MenuType
): MenuType[] => {
  const newRoutes: MenuType[] = [];

  routes?.forEach((route) => {
    let children: MenuType[] | undefined = undefined;
    if (route.children) {
      children = formatMenu(route.children, all, cloneDeep(route) as MenuType);
    }

    const { meta } = route;

    if ((!all ? meta?.menu : true) && route.path) {
      newRoutes.push({
        key: route.path,
        title: meta?.name,
        label: meta?.name,
        icon: meta?.icon,
        defaultIcon: meta?.icon,
        activeIcon: meta?.activeIcon,
        disabled: meta?.disabled,
        children: (children?.length || 0) > 0 ? children : undefined,
        parent: parent,
      });
    } else if ((!all ? meta?.menu : true) && route.index && parent?.path) {
      newRoutes.push({
        key: parent.path,
        title: meta?.name,
        label: meta?.name,
        icon: meta?.icon,
        defaultIcon: meta?.icon,
        activeIcon: meta?.activeIcon,
        disabled: meta?.disabled,
      });
    } else {
      if (children) {
        newRoutes.push(...children);
      }
    }
  });

  return newRoutes;
};
