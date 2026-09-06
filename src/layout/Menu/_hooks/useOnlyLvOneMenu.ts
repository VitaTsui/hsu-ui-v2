import { useEffect } from "react";
import { useLatestRef } from "../../../hooks/useLatestRef";
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
  // getCurrChildItems 是 effect 体里发出去的通知，本身进依赖数组是这一类死循环的标准配方：
  // 消费方传内联箭头 → 每次渲染新引用 → effect 重跑 → setOpenkeys([item.key]) 每次都是
  // 新数组必定触发重渲染 → 又是新引用 …… 直到 React 抛 Maximum update depth exceeded。
  // 通知取 ref 里的最新引用，依赖数组只留真正的输入。
  const getCurrChildItemsRef = useLatestRef(getCurrChildItems);

  useEffect(() => {
    if (onlyLvOneMenu) {
      const item = items.find(
        (i) => i.key === "/" + location.pathname.split("/").filter(Boolean)[0]
      );
      if (item) {
        getCurrChildItemsRef.current?.(item.children || []);
        setOpenkeys([item.key]);
        setMenuKey(item.key);
      }
    }
  }, [
    items,
    getCurrChildItemsRef,
    location,
    onlyLvOneMenu,
    setOpenkeys,
    setMenuKey,
  ]);
};
