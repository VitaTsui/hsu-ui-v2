import { useEffect, useContext } from "react";
import { useAliveController } from "react-activation";
import { NavTabBarContent } from "../../_hooks/useDropTab";
import { TabType } from "..";

/**
 * Hook that closes a tab via dropKey
 */
export const useDropTabKey = (
  setOpenkeys: React.Dispatch<React.SetStateAction<TabType[]>>
) => {
  const { drop } = useAliveController();
  const { dropKey } = useContext(NavTabBarContent);

  useEffect(() => {
    setTimeout(() => {
      if (dropKey) {
        drop(dropKey);

        setOpenkeys((prev) => {
          const newOpenKeys = prev.filter((item) => item.key !== dropKey);
          return newOpenKeys;
        });
      }
    }, 0);
  }, [drop, dropKey, setOpenkeys]);
};
