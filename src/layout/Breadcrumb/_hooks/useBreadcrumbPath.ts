import { useEffect, useState, useContext, useMemo } from "react";
import { useLocation } from "react-router";
import { BreadcrumbType } from "..";
import { checkBreadcrumbPathMatch } from "../_utils/pathMatch";
import { NavTabBarTitleContent } from "../../_hooks/useSetTabTitle";

/**
 * Hook that handles breadcrumb path matching
 */
export const useBreadcrumbPath = (_routes: BreadcrumbType[]) => {
  const location = useLocation();
  const { tabTitles } = useContext(NavTabBarTitleContent);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbType[]>([]);

  const pathname = useMemo(
    () => decodeURI(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    const _setBreadcrumb = (
      routes: BreadcrumbType[],
      parents?: BreadcrumbType[]
    ) => {
      const checkPath = (item: BreadcrumbType) => {
        if (item.path) {
          const isMatch = checkBreadcrumbPathMatch(
            pathname,
            item.path,
            item.parent?.path
          );

          if (isMatch) {
            // If tabTitles has a title for the current path, apply the custom title
            const finalItem =
              tabTitles && tabTitles[pathname] !== undefined
                ? { ...item, title: tabTitles[pathname] }
                : item;

            if (parents) {
              return [...parents, finalItem];
            } else {
              return [finalItem];
            }
          }
        }

        return [];
      };

      routes?.forEach((item) => {
        if (item.children) {
          if (item.route?.index) {
            const _breadcrumb = checkPath(item);
            if (_breadcrumb.length > 0) {
              setBreadcrumb(_breadcrumb);
            } else {
              const _newParents = parents ? [...parents, item] : [item];
              _setBreadcrumb(item.children, _newParents);
            }
          } else {
            const _newParents = parents ? [...parents, item] : [item];
            _setBreadcrumb(item.children, _newParents);
          }
        } else {
          const _breadcrumb = checkPath(item);
          if (_breadcrumb.length > 0) {
            setBreadcrumb(_breadcrumb);
          }
        }
      });
    };

    setBreadcrumb([]);
    _setBreadcrumb(_routes);
  }, [_routes, pathname, tabTitles]);

  // When tabTitles changes, update the title of the last breadcrumb item
  useEffect(() => {
    if (!pathname) return;

    setBreadcrumb((prev) => {
      if (prev.length === 0) return prev;

      const newBreadcrumb = [...prev];
      const lastItem = newBreadcrumb[newBreadcrumb.length - 1];

      // Check whether the current path matches the last breadcrumb item
      const isPathMatch =
        lastItem.path === pathname ||
        (lastItem.path &&
          checkBreadcrumbPathMatch(
            pathname,
            lastItem.path,
            lastItem.parent?.path
          ));

      if (isPathMatch && tabTitles && tabTitles[pathname] !== undefined) {
        // If tabTitles has a title for the current path, update it
        newBreadcrumb[newBreadcrumb.length - 1] = {
          ...lastItem,
          title: tabTitles[pathname],
        };
      }

      return newBreadcrumb;
    });
  }, [tabTitles, pathname]);

  return breadcrumb;
};
