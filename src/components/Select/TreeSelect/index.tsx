import {
  TreeSelect as AntdTreeSelect,
  TreeSelectProps as AntdTreeSelectProps,
} from "antd";
import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  CSSProperties,
} from "react";
import type { TreeSelectRef } from "../../../types/antd";
import Icon from "../../Icon";
import classNames from "classnames";
import styles from "./index.module.scss";
import { useSelectComposition, useSelectPopupPosition } from "../_hooks";
import { getElementLeft } from "../_utils";
import { generateRandomStr } from "hsu-utils";
import {
  getExpandedKeysByLevel,
  getInitialTreeExpandedKeys,
  shouldApplyTreeDefaultExpandedKeys,
  shouldSyncControlledExpandedKeys,
  shouldSyncDefaultExpandLevelKeys,
} from "./_utils";

type FilterTreeNode = NonNullable<AntdTreeSelectProps["filterTreeNode"]>;

export interface TreeSelectProps extends Omit<
  AntdTreeSelectProps,
  "filterTreeNode" | "popupMatchSelectWidth" | "dropdownStyle"
> {
  className?: string;
  filterTreeNode?: FilterTreeNode;
  popupMatchSelectWidth?: boolean | number;
  dropdownStyle?: React.CSSProperties;
  indent?: number;
  switchWidth?: number;
  switchGap?: number;
  /** Default expand level. Starts from 1. */
  defaultExpandLevel?: number;
}

const TreeSelect: React.FC<TreeSelectProps> = (props) => {
  const {
    className,
    onSearch,
    filterTreeNode: customFilterTreeNode,
    popupMatchSelectWidth,
    dropdownStyle,
    style: customStyle,
    popupClassName,
    treeExpandedKeys: treeExpandedKeysProps,
    onTreeExpand,
    treeDefaultExpandedKeys,
    defaultExpandLevel,
    indent,
    switchWidth,
    switchGap,
    treeData,
    ...antdTreeSelectConfig
  } = props;
  const cls = useMemo(() => generateRandomStr(10), []);
  const ref = useRef<TreeSelectRef>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);
  const { isComposing } = useSelectComposition({ onSearch });
  const [open, setOpen] = useState<boolean>(false);

  useSelectPopupPosition(containerRef, open, cls);

  const style = useMemo<CSSProperties>(
    () =>
      ({
        ...customStyle,
        "--tree-indent-unit-width":
          typeof indent === "number" ? `${indent}px` : undefined,
        "--tree-switcher-width":
          typeof switchWidth === "number" ? `${switchWidth}px` : undefined,
        "--tree-switcher-gap":
          typeof switchGap === "number" ? `${switchGap}px` : undefined,
      }) as CSSProperties,
    [customStyle, indent, switchWidth, switchGap],
  );

  // Compute default expanded keys from defaultExpandLevel.
  const computedDefaultExpandLevelKeys = useMemo(() => {
    if (
      defaultExpandLevel !== undefined &&
      defaultExpandLevel > 0 &&
      treeData
    ) {
      return getExpandedKeysByLevel(treeData, defaultExpandLevel);
    }
    return undefined;
  }, [defaultExpandLevel, treeData]);

  const [treeExpandedKeys, setTreeExpandedKeys] = useState<
    AntdTreeSelectProps["treeExpandedKeys"]
  >(
    getInitialTreeExpandedKeys(
      treeExpandedKeysProps,
      treeDefaultExpandedKeys,
      computedDefaultExpandLevelKeys,
    ),
  );
  const prevPropsRef = useRef<AntdTreeSelectProps["treeExpandedKeys"]>(
    treeExpandedKeysProps,
  );
  const prevDefaultRef = useRef<AntdTreeSelectProps["treeExpandedKeys"]>(
    computedDefaultExpandLevelKeys,
  );
  const hasUserInteractedRef = useRef(false);
  const hasAppliedTreeDefaultRef = useRef(
    treeDefaultExpandedKeys !== undefined,
  );

  useEffect(() => {
    if (
      shouldSyncControlledExpandedKeys(
        prevPropsRef.current,
        treeExpandedKeysProps,
      )
    ) {
      prevPropsRef.current = treeExpandedKeysProps;
      setTreeExpandedKeys(treeExpandedKeysProps);
    }
  }, [treeExpandedKeysProps]);

  useEffect(() => {
    if (
      shouldApplyTreeDefaultExpandedKeys(
        treeExpandedKeysProps,
        hasUserInteractedRef.current,
        treeDefaultExpandedKeys,
        hasAppliedTreeDefaultRef.current,
      )
    ) {
      hasAppliedTreeDefaultRef.current = true;
      setTreeExpandedKeys(treeDefaultExpandedKeys);
      return;
    }

    if (
      shouldSyncDefaultExpandLevelKeys(
        treeExpandedKeysProps,
        hasUserInteractedRef.current,
        hasAppliedTreeDefaultRef.current,
        prevDefaultRef.current,
        computedDefaultExpandLevelKeys,
      )
    ) {
      prevDefaultRef.current = computedDefaultExpandLevelKeys;
      setTreeExpandedKeys(computedDefaultExpandLevelKeys);
    }
  }, [
    computedDefaultExpandLevelKeys,
    treeExpandedKeysProps,
    treeDefaultExpandedKeys,
  ]);

  const handleTreeExpand = useCallback<
    NonNullable<AntdTreeSelectProps["onTreeExpand"]>
  >(
    (expandedKeys) => {
      hasUserInteractedRef.current = true;
      setTreeExpandedKeys(expandedKeys);
      onTreeExpand?.(expandedKeys);
    },
    [onTreeExpand],
  );

  const getPopupContainer = useCallback((triggerNode: HTMLElement) => {
    const container =
      (triggerNode?.parentElement?.closest(
        `.${styles.treeSelect}`,
      ) as HTMLDivElement) ?? (document.body as HTMLDivElement);
    containerRef.current = container;
    setContainerElement(container);
    return container;
  }, []);

  return (
    <AntdTreeSelect
      showSearch
      allowClear
      {...antdTreeSelectConfig}
      treeData={treeData}
      {...(treeExpandedKeys !== undefined && { treeExpandedKeys })}
      onTreeExpand={handleTreeExpand}
      onOpenChange={setOpen}
      className={classNames(styles.treeSelect, className)}
      onSearch={(value) => {
        if (!isComposing) {
          onSearch?.(value);
        }
      }}
      filterTreeNode={
        customFilterTreeNode
          ? typeof customFilterTreeNode === "function"
            ? (searchValue, node) => customFilterTreeNode(searchValue, node)
            : customFilterTreeNode
          : (searchValue, node) => {
              if (isComposing) {
                return true;
              }

              const title = node?.title?.toString() ?? "";

              return title.includes(searchValue);
            }
      }
      getPopupContainer={getPopupContainer}
      // v6 replaced `popupClassName` / `dropdownStyle` with the `popup.root` semantic slot; this
      // component's own props keep the old names for consumers.
      classNames={{ popup: { root: `${cls} ${popupClassName ?? ""}` } }}
      style={style}
      popupMatchSelectWidth={
        popupMatchSelectWidth ??
        (containerElement ? containerElement.offsetWidth : undefined)
      }
      styles={{
        popup: {
          root: {
            ...dropdownStyle,
            left: containerElement
              ? getElementLeft(containerElement)
              : undefined,
            right: "auto",
          },
        },
      }}
      suffixIcon={<Icon icon="ep:arrow-down" />}
      ref={ref}
    />
  );
};

export default TreeSelect;
