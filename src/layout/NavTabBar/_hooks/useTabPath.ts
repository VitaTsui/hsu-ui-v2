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
   * 路径匹配只跟着**地址**跑，不跟着 openKeys 的空/非空跑。
   *
   * 这里原本还挂了一个 `isEmpty` 依赖：openKeys 一变空就重跑一次匹配，用意是补上
   * 「关掉的正是 basePath 那一页 ⇒ navigate(basePath) 不改变地址 ⇒ 匹配不会重跑」
   * 这一档。但它会把**刚关掉的那个页签原样加回来**：
   *
   * 关闭按钮里 `setOpenkeys([])` 是默认优先级的更新，而 `navigate()` 引起的
   * location 变更走的是 router 的低优先级更新（startTransition / deferred 路由表）。
   * React 先提交前者，此时 `useLocation()` 还停在**被关掉的那一页**，本 effect 因
   * `isEmpty` 翻转而跑了一遍，匹配到的自然还是它，于是页签复活；等 location 真正
   * 落地，匹配又把目标页加成第二个页签。用户看到的就是「点一次关不掉，还多出一个」，
   * 非得再点一次。
   *
   * 所以不补那一档：**页签栏空着是合法状态**。关掉最后一个页签时，若目标地址与当前
   * 地址不同，location 变化自会把目标页签匹配出来；若相同（关掉的就是 basePath），
   * 页签栏就空着，内容区仍是 basePath 那一页 —— 一次点击、不复活、不空白。
   */
  useEffect(() => {
    // Handle affixed routes first to populate openKeys
    _checkAffix(items);
    // Then run path matching
    _checkPath(items);
  }, [_checkAffix, _checkPath, items]);

  return { tabKey, setTabKey, openKeys, setOpenkeys };
};
