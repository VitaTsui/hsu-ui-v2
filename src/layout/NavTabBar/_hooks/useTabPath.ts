import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { TabType } from "..";
import { checkTabPathMatch } from "../_utils/pathMatch";
import { array_is_includes } from "hsu-utils";

interface UseTabPathOptions {
  items: TabType[];
  affixRouter: string[];
}

/**
 * Hook that handles tab path matching and active state
 */
export const useTabPath = ({ items, affixRouter }: UseTabPathOptions) => {
  const location = useLocation();
  const [tabKey, setTabKey] = useState<string>("");
  const [openKeys, setOpenkeys] = useState<TabType[]>([]);

  /**
   * Check affixed routes (affixRouter and affix) and add them to openKeys
   */
  const _checkAffix = useCallback(
    (items: TabType[]) => {
      items?.forEach((item) => {
        if (item.children) {
          _checkAffix(item.children);
        } else {
          // Check whether it is an affixed route
          const isAffix = affixRouter.includes(item.key) || item.affix;
          if (isAffix) {
            setOpenkeys((prev) => {
              const find = prev.find((i) => i.key === item.key);
              if (find) {
                return prev;
              }
              return [...prev, item];
            });
          }
        }
      });
    },
    [affixRouter]
  );

  const _checkPath = useCallback(
    (items: TabType[], parents?: TabType[]) => {
      const pathname = decodeURI(location.pathname);
      const search = location.search;

      items?.forEach((item) => {
        if (item.children) {
          const _parents = parents ? [...parents, item] : [item];
          _checkPath(item.children, _parents);
        } else {
          const isMatch = checkTabPathMatch(pathname, item.key);

          if (isMatch) {
            const keyArr = item.key.split("/").filter(Boolean);
            const hasParams =
              keyArr.filter((i) => i.startsWith(":")).length > 0;
            const pathArr = pathname.split("/").filter(Boolean);

            if (
              hasParams &&
              array_is_includes(
                keyArr.filter((i) => !i.startsWith(":")),
                pathArr
              )
            ) {
              // Handle param routes
              setTabKey(`${pathname}${search}`);

              setOpenkeys((prev) => {
                const find = prev.find((i) => i.key.split("?")[0] === pathname);
                if (find) {
                  return prev.map((i) =>
                    i.key.split("?")[0] === pathname
                      ? { ...i, key: `${pathname}${search}` }
                      : i
                  );
                }

                return [...prev, { ...item, key: `${pathname}${search}` }];
              });
            } else {
              // Handle plain routes
              setTabKey(`${item.key}${search}`);

              setOpenkeys((prev) => {
                const find = prev.find((i) => i.key.split("?")[0] === item.key);
                if (find) {
                  return prev.map((i) =>
                    i.key.split("?")[0] === item.key
                      ? { ...i, key: `${item.key}${search}` }
                      : i
                  );
                }

                return [...prev, { ...item, key: `${item.key}${search}` }];
              });
            }
          }
        }
      });
    },
    [location.pathname, location.search]
  );

  useEffect(() => {
    // Handle affixed routes first to populate openKeys
    _checkAffix(items);
    // Then run path matching
    _checkPath(items);
  }, [_checkAffix, _checkPath, items]);

  return { tabKey, setTabKey, openKeys, setOpenkeys };
};
