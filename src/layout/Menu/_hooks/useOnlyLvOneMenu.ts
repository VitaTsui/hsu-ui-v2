import { useEffect } from "react";
import { useLocation } from "react-router";
import { MenuType } from "..";

interface UseOnlyLvOneMenuOptions {
  items: MenuType[];
  onlyLvOneMenu: boolean;
  getCurrChildItems?: (children: MenuType[]) => void;
  setOpenkeys: (keys: string[]) => void;
  setMenuKey: (key: string) => void;
}

/**
 * Handle the top-level-only menu logic
 */
export const useOnlyLvOneMenu = ({
  items,
  onlyLvOneMenu,
  getCurrChildItems,
  setOpenkeys,
  setMenuKey,
}: UseOnlyLvOneMenuOptions) => {
  const location = useLocation();

  useEffect(() => {
    if (onlyLvOneMenu) {
      const item = items.find(
        (i) => i.key === "/" + location.pathname.split("/").filter(Boolean)[0]
      );
      if (item) {
        getCurrChildItems?.(item.children || []);
        setOpenkeys([item.key]);
        setMenuKey(item.key);
      }
    }
  }, [
    items,
    getCurrChildItems,
    location,
    onlyLvOneMenu,
    setOpenkeys,
    setMenuKey,
  ]);
};
