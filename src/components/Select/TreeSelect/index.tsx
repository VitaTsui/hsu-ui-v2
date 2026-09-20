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
import { useSelectComposition, useSelectPopupRect } from "../_hooks";
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
    onOpenChange,
    ...antdTreeSelectConfig
  } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* 这个组件要拿自己的根节点（带 `styles.treeSelect` 类名的那个 `.ant-select`）来干三件事：
     给浮层算宽度、算 left、以及当浮层的挂载容器。从前它是从 `getPopupContainer` 的
     参数里爬出来的，两处都错：

     1. `getPopupContainer` 是 antd 的 Portal **在渲染期**调的回调，从前在里面直接
        `setState` 把节点存下来 —— 在别的组件渲染过程中改自己的 state，React 每次首开
        都报 `Cannot update a component (TreeSelect) while rendering a different
        component (Portal)`。
     2. 爬法本身写错了：`triggerNode` 传进来的就是根节点本人，而代码写的是
        `triggerNode.parentElement.closest('.treeSelect')` —— `closest` 从**父节点**往上
        找，永远够不着它自己，于是每次都落到 `?? document.body` 的兜底上。
        后果是这三样全是拿 `document.body` 量的：浮层宽度 = 整页宽（实测 1200px，
        而触发元素只有 685px）、left = 0（触发元素在 300px）、当时那个轮询定位的 hook
        从第二次展开起把浮层顶到 `body.offsetHeight + 4` ≈ 941px，直接掉出可视区。

     改成从 antd 自己的 ref 拿：`BaseSelectRef.nativeElement` 就是那个根节点。回调 ref 在
     **提交阶段**执行，早于 `useSelectPopupRect` 的 `useLayoutEffect`，也早于绘制 ——
     首开就已经有宽度和 left，不像从前要等那次「警告顺带触发的重渲染」才补上。 */
  const attachContainer = useCallback((instance: TreeSelectRef | null) => {
    containerRef.current = (instance?.nativeElement as HTMLDivElement) ?? null;
  }, []);
  const { isComposing } = useSelectComposition({ onSearch });
  const [open, setOpen] = useState<boolean>(false);

  /* `TreeSelect` 没有外壳，根节点就是 antd 自己的触发节点，所以这里量出来的 left 与
     antd 算的是同一个值；保持和 `Select` / `AutoCompleteSelect` 同一套写法，不另开一条。
     宽度也从这里出：从前是渲染期读一次 `containerElement.offsetWidth`，控件变宽时组件
     不重渲染，浮层宽度就钉在展开那一刻的旧值上。详见 `useSelectPopupRect`。 */
  const { left: popupLeft, width: containerWidth } = useSelectPopupRect(
    containerRef,
    open,
  );

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

  // 纯读，没有副作用；和基础 `Select` 的 `getPopupContainer` 同一个写法。
  // 浮层挂进根节点里，`index.module.scss` 里那一整块
  // `.treeSelect .ant-tree-select-dropdown`（`position: fixed`、字体继承、
  // `--tree-indent-unit-width` 等缩进变量）才生效 —— 也就是 `indent` / `switchWidth` /
  // `switchGap` 三个 props 才真的有用。
  const getPopupContainer = useCallback(
    () => containerRef.current ?? document.body,
    [],
  );

  return (
    <AntdTreeSelect
      showSearch
      allowClear
      {...antdTreeSelectConfig}
      treeData={treeData}
      {...(treeExpandedKeys !== undefined && { treeExpandedKeys })}
      onTreeExpand={handleTreeExpand}
      /* `open` 由 `useSelectPopupLeft` 用着，所以这里必须自己记一份；但记完要把
         消费方自己传的 `onOpenChange` 原样往下叫一声。从前这里只写 `setOpen`，它排在
         `{...antdTreeSelectConfig}` 展开之后，于是消费方传进来的那个被整个盖掉、
         静默丢失 —— 和 2.7.1 修基础 `Select` 时是同一个毛病。 */
      onOpenChange={(visible) => {
        setOpen(visible);
        onOpenChange?.(visible);
      }}
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
      classNames={{ popup: { root: popupClassName } }}
      style={style}
      popupMatchSelectWidth={
        popupMatchSelectWidth ?? (containerWidth || undefined)
      }
      styles={{
        popup: {
          root: {
            ...dropdownStyle,
            left: popupLeft,
            right: "auto",
          },
        },
      }}
      suffixIcon={<Icon icon="ep:arrow-down" />}
      ref={attachContainer}
    />
  );
};

export default TreeSelect;
