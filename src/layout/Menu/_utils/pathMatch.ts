import { array_is_includes } from "hsu-utils";

/**
 * Check whether a path matches
 * @param pathname Current path
 * @param key Route key
 * @param parentPath Parent path
 * @returns Whether it matches
 */
export const checkPathMatch = (
  pathname: string,
  key: string,
  parentPath?: string
): boolean => {
  const pathArr = pathname.split("/").filter(Boolean);
  const keyArr = key.split("/").filter(Boolean);

  if (keyArr.length === 0) {
    return pathname === "/" && key === "/";
  }

  if (pathArr.length !== keyArr.length) {
    return false;
  }

  // Handle the root path
  if (pathname === "/" && key === "/") {
    return true;
  }

  // Handle routes with params (e.g. /user/:id)
  if (key.includes(":")) {
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

