import { cloneDeep } from "lodash";
import { RouteType } from "../../types";
import { TabType } from "..";

/**
 * Format routes into tab items
 * @param routes Route configuration
 * @param parent Parent tab item
 * @returns Array of tab items
 */
export const formatNavTabBar = (
  routes: RouteType[],
  parent?: TabType
): TabType[] => {
  const newRoutes: TabType[] = [];

  routes?.forEach((route) => {
    let children: TabType[] | undefined = undefined;
    if (route.children) {
      children = formatNavTabBar(route.children, cloneDeep(route) as TabType);
    }

    const { meta } = route;

    if (!meta?.noTabsView && route.path) {
      newRoutes.push({
        key: decodeURI(route.path),
        label: meta?.name ?? "",
        children: (children?.length || 0) > 0 ? children : undefined,
        element: route.element,
        affix: meta?.affix,
        icon: meta?.icon,
      });
    } else if (!meta?.noTabsView && route.index && parent?.path) {
      newRoutes.push({
        key: decodeURI(parent.path),
        label: meta?.name ?? "",
        element: route.element,
        affix: meta?.affix,
        icon: meta?.icon,
      });
    } else {
      if (children) {
        newRoutes.push(...children);
      }
    }
  });

  return newRoutes;
};
