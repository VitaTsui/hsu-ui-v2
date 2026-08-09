import { array_is_includes } from "hsu-utils";

/**
 * Check whether a path matches (used by the breadcrumb)
 * @param pathname Current path
 * @param itemPath Route path
 * @param parentPath Parent path
 * @returns Whether it matches
 */
export const checkBreadcrumbPathMatch = (
  pathname: string,
  itemPath: string,
  parentPath?: string
): boolean => {
  if (!itemPath) {
    return pathname === "/" && itemPath === "/";
  }

  const pathArr = pathname.split("/").filter(Boolean);
  const keyArr = itemPath.split("/").filter(Boolean);

  if (keyArr.length === 0) {
    return false;
  }

  if (pathArr.length !== keyArr.length) {
    return false;
  }

  // Handle the root path
  if (pathname === "/" && itemPath === "/") {
    return true;
  }

  // Handle routes containing params (e.g. /user/:id)
  if (itemPath.includes(":")) {
    if (parentPath === "/") {
      // If the parent path is the root path, check that there are no non-param segments
      return !keyArr.filter((i: string) => !i.startsWith(":")).length;
    } else {
      // Filter out param segments and compare only the non-param parts
      return array_is_includes(
        keyArr.filter((i: string) => !i.startsWith(":")),
        pathArr
      );
    }
  } else {
    // Plain path matching
    return array_is_includes(keyArr, pathArr);
  }
};

