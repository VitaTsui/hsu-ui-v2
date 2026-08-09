import { array_is_includes } from "hsu-utils";

/**
 * Check whether a path matches (used by tabs)
 * Note: matching of affixed routes (affixRouter and affix) is handled separately in _checkAffix of useTabPath
 * @param pathname Current path
 * @param key Route key
 * @returns Whether it matches
 */
export const checkTabPathMatch = (pathname: string, key: string): boolean => {
  // Handle the root path
  if (pathname === "/" && key === "/") {
    return true;
  }

  const pathArr = pathname.split("/").filter(Boolean);
  const keyArr = key.split("/").filter(Boolean);

  if (keyArr.length === 0) {
    return false;
  }

  if (pathArr.length !== keyArr.length) {
    return false;
  }

  // Handle routes containing params (e.g. /user/:id)
  if (key.includes(":")) {
    return array_is_includes(
      keyArr.filter((i) => !i.startsWith(":")),
      pathArr
    );
  } else {
    // Plain path matching
    return array_is_includes(keyArr, pathArr);
  }
};
