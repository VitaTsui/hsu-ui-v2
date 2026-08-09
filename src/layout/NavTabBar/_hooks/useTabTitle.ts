import { useEffect, useContext } from "react";
import { NavTabBarTitleContent } from "../../_hooks/useSetTabTitle";
import { TabType } from "..";

/**
 * Hook that updates tab titles via tabTitles
 */
export const useTabTitle = (
  setOpenkeys: React.Dispatch<React.SetStateAction<TabType[]>>
) => {
  const { tabTitles } = useContext(NavTabBarTitleContent);

  useEffect(() => {
    if (tabTitles && Object.keys(tabTitles).length > 0) {
      setOpenkeys((prev) => {
        return prev?.map((item) => {
          if (tabTitles[item.key] !== undefined) {
            return {
              ...item,
              label: tabTitles[item.key],
            };
          }
          return item;
        });
      });
    }
  }, [tabTitles, setOpenkeys]);
};
