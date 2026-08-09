import { MenuType } from "..";

/**
 * Set the active icon for menu items
 * @param items Menu item array
 * @param menuKey Key of the currently active menu
 */
export const setActiveIcon = (items: MenuType[], menuKey: string): void => {
  items?.forEach((item) => {
    if (item.children) {
      setActiveIcon(item.children, menuKey);
    } else {
      if (item.activeIcon && item.key === menuKey) {
        item.icon = item.activeIcon;
      } else {
        item.icon = item.defaultIcon;
      }
    }

    delete item.activeIcon;
    delete item.defaultIcon;
  });
};
