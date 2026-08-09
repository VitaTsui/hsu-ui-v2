import { TabType } from "..";

/**
 * Close the tab at the given index (keeping pinned tabs)
 */
export const closeTab = (
  openKeys: TabType[],
  index: number,
  drop: (key: string) => void,
  affixRouter: string[] = []
): TabType[] => {
  const targetItem = openKeys[index];
  // Do not close if it is a pinned tab
  if (affixRouter.includes(targetItem.key) || targetItem.affix) {
    return openKeys;
  }

  const newOpenKeys = [...openKeys];
  const removed = newOpenKeys.splice(index, 1);
  removed?.forEach((item) => {
    drop(item.key?.split("?")[0] || "");
  });
  return newOpenKeys;
};

/**
 * Close tabs to the left (keeping pinned tabs)
 */
export const closeLeftTabs = (
  openKeys: TabType[],
  index: number,
  drop: (key: string) => void,
  affixRouter: string[] = []
): TabType[] => {
  // Split off the tabs on the left
  const leftTabs = openKeys.slice(0, index);
  const rightTabs = openKeys.slice(index);

  // Filter out the non-pinned tabs on the left and close them
  const removedTabs = leftTabs.filter(
    (item) => !affixRouter.includes(item.key) && !item.affix
  );
  removedTabs.forEach((item) => {
    drop(item.key?.split("?")[0] || "");
  });

  // Keep the pinned tabs on the left and all tabs on the right
  const keptLeftTabs = leftTabs.filter(
    (item) => affixRouter.includes(item.key) || item.affix
  );
  return [...keptLeftTabs, ...rightTabs];
};

/**
 * Close tabs to the right (keeping pinned tabs)
 */
export const closeRightTabs = (
  openKeys: TabType[],
  index: number,
  drop: (key: string) => void,
  affixRouter: string[] = []
): TabType[] => {
  // Split into left and right tabs
  const leftTabs = openKeys.slice(0, index + 1);
  const rightTabs = openKeys.slice(index + 1);

  // Filter out the non-pinned tabs on the right and close them
  const removedTabs = rightTabs.filter(
    (item) => !affixRouter.includes(item.key) && !item.affix
  );
  removedTabs.forEach((item) => {
    drop(item.key?.split("?")[0] || "");
  });

  // Keep all tabs on the left and the pinned tabs on the right
  const keptRightTabs = rightTabs.filter(
    (item) => affixRouter.includes(item.key) || item.affix
  );
  return [...leftTabs, ...keptRightTabs];
};

/**
 * Close other tabs (keeping pinned tabs)
 */
export const closeOtherTabs = (
  openKeys: TabType[],
  currentItem: TabType,
  drop: (key: string) => void,
  affixRouter: string[] = []
): TabType[] => {
  // Filter out the other non-pinned tabs and close them
  const removedTabs = openKeys.filter(
    (item) =>
      item.key !== currentItem.key &&
      !affixRouter.includes(item.key) &&
      !item.affix
  );
  removedTabs.forEach((item) => {
    drop(item.key?.split("?")[0] || "");
  });

  // Keep the current tab and all pinned tabs
  return openKeys.filter(
    (item) =>
      item.key === currentItem.key ||
      affixRouter.includes(item.key) ||
      item.affix
  );
};

/**
 * Close all tabs (keeping pinned tabs)
 */
export const closeAllTabs = (
  openKeys: TabType[],
  drop: (key: string) => void,
  affixRouter: string[] = []
): TabType[] => {
  // Filter out the non-pinned tabs and close them
  const removedTabs = openKeys.filter(
    (item) => !affixRouter.includes(item.key) && !item.affix
  );
  removedTabs.forEach((item) => {
    drop(item.key?.split("?")[0] || "");
  });

  // Return the pinned tabs
  return openKeys.filter(
    (item) => affixRouter.includes(item.key) || item.affix
  );
};
