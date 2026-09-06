import { useEffect, useState, Key, useMemo, useRef, useCallback } from "react";
import { Equal } from "hsu-utils";
import { CheckedKeys, TreeData } from "..";
import { normalizeCheckedKeys } from "../_utils/normalizeCheckedKeys";

/**
 * Hook for syncing external expandedKeys
 */
export const useExpandedKeys = (
  expandedKeysProps?: Key[],
  defaultExpandedKeys?: Key[]
) => {
  const [expandedKeys, setExpandedKeys] = useState<Key[] | undefined>(
    defaultExpandedKeys
  );
  const prevPropsRef = useRef<Key[] | undefined>(expandedKeysProps);
  const prevDefaultRef = useRef<Key[] | undefined>(defaultExpandedKeys);
  // Flag indicating whether the user has manually changed the expanded state
  const hasUserInteractedRef = useRef(false);

  // Watch for expandedKeysProps changes in controlled mode
  useEffect(() => {
    if (
      expandedKeysProps !== undefined &&
      !Equal.ObjEqual(prevPropsRef.current, expandedKeysProps)
    ) {
      prevPropsRef.current = expandedKeysProps;
      setExpandedKeys(expandedKeysProps);
    }
  }, [expandedKeysProps]);

  // Watch for defaultExpandedKeys changes (in uncontrolled mode, used to respond to async data loading)
  useEffect(() => {
    // Only respond to defaultExpandedKeys changes in uncontrolled mode when the user has not manually interacted
    if (
      expandedKeysProps === undefined &&
      !hasUserInteractedRef.current &&
      !Equal.ObjEqual(prevDefaultRef.current, defaultExpandedKeys)
    ) {
      prevDefaultRef.current = defaultExpandedKeys;
      setExpandedKeys(defaultExpandedKeys);
    }
  }, [defaultExpandedKeys, expandedKeysProps]);

  // Wrap setExpandedKeys to mark that the user has manually interacted.
  // 必须 useCallback：这个函数被 Tree 的 handleExpand 当依赖用，
  // 每渲染新建一个就让那个 useCallback 恒不命中——展开回调每渲染换引用透给 antd Tree。
  // 函数体只碰 ref 和状态 setter，两者都恒定，所以依赖数组是空的。
  const handleSetExpandedKeys = useCallback(
    (
      keys: Key[] | undefined | ((prev: Key[] | undefined) => Key[] | undefined)
    ) => {
      hasUserInteractedRef.current = true;
      setExpandedKeys(keys);
    },
    []
  );

  return [expandedKeys, handleSetExpandedKeys] as const;
};

/**
 * Hook for syncing external checkedKeys
 * Auto-normalizes: when a parent is in checked but its children are not all checked, the parent is set to half-checked
 */
export const useCheckedKeys = (
  checkedKeysProps?: CheckedKeys,
  treeData?: TreeData[]
) => {
  // Normalize checkedKeys
  const normalizedCheckedKeys = useMemo(() => {
    if (!checkedKeysProps || !treeData?.length) {
      return checkedKeysProps;
    }
    return normalizeCheckedKeys(checkedKeysProps, treeData);
  }, [checkedKeysProps, treeData]);

  const [checkedKeys, setCheckedKeys] = useState<CheckedKeys | undefined>(
    () => normalizedCheckedKeys
  );
  const prevNormalizedRef = useRef<CheckedKeys | undefined>(
    normalizedCheckedKeys
  );

  useEffect(() => {
    // Only update when the normalized value has actually changed
    if (
      normalizedCheckedKeys !== undefined &&
      !Equal.ObjEqual(prevNormalizedRef.current, normalizedCheckedKeys)
    ) {
      prevNormalizedRef.current = normalizedCheckedKeys;
      setCheckedKeys(normalizedCheckedKeys);
    }
  }, [normalizedCheckedKeys]);

  return [checkedKeys, setCheckedKeys] as const;
};
