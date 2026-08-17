import { useCallback, useEffect, useMemo, useState } from "react";
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

  /**
   * Keyed on the *contents* of `affixRouter`, not on the array itself.
   *
   * Callers pass an inline literal (`affixRouter={[HOME]}`), and omitting the prop hands the
   * component a fresh `[]` default on every render — either way the array identity changes each
   * time. Depending on it directly re-runs the effect below on every render, and that effect
   * calls setState, so the whole thing becomes a render loop.
   */
  const affixKey = affixRouter.join("\u0001");
  const affixSet = useMemo(() => new Set(affixKey ? affixKey.split("\u0001") : []), [affixKey]);
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
          const isAffix = affixSet.has(item.key) || item.affix;
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
    [affixSet]
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
                const nextKey = `${pathname}${search}`;
                const find = prev.find((i) => i.key.split("?")[0] === pathname);
                if (find) {
                  // Already on this key: return `prev` untouched. `map` builds a new array
                  // every time, and React treats a new reference as a state change — which is
                  // the other half of the render loop above.
                  if (find.key === nextKey) {
                    return prev;
                  }
                  return prev.map((i) =>
                    i.key.split("?")[0] === pathname ? { ...i, key: nextKey } : i
                  );
                }

                return [...prev, { ...item, key: nextKey }];
              });
            } else {
              // Handle plain routes
              setTabKey(`${item.key}${search}`);

              setOpenkeys((prev) => {
                const nextKey = `${item.key}${search}`;
                const find = prev.find((i) => i.key.split("?")[0] === item.key);
                if (find) {
                  // Same as above: an unchanged tab must not produce a new reference
                  if (find.key === nextKey) {
                    return prev;
                  }
                  return prev.map((i) =>
                    i.key.split("?")[0] === item.key
                      ? { ...i, key: nextKey }
                      : i
                  );
                }

                return [...prev, { ...item, key: nextKey }];
              });
            }
          }
        }
      });
    },
    [location.pathname, location.search]
  );

  /**
   * Closing the last tab navigates to `basePath` — but when that tab *was* `basePath`, the
   * location never changes, so path matching would not re-run and the bar would be left empty
   * while its page is still on screen. Going empty has to re-trigger the match on its own.
   *
   * This settles rather than looping: re-matching adds the tab back, which flips `isEmpty` and
   * runs the effect once more, and that pass finds the tab already present and returns the same
   * state object — so React stops there. (Only true because the setters below bail out when
   * nothing changed; without that this would spin.)
   */
  const isEmpty = openKeys.length === 0;

  useEffect(() => {
    // Handle affixed routes first to populate openKeys
    _checkAffix(items);
    // Then run path matching
    _checkPath(items);
  }, [_checkAffix, _checkPath, items, isEmpty]);

  return { tabKey, setTabKey, openKeys, setOpenkeys };
};
