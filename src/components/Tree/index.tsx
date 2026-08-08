import { Tree as AntdTree, TreeProps as AntdTreeProps } from "antd";
import React, {
  ReactNode,
  useMemo,
  CSSProperties,
  useCallback,
  Key,
  useEffect,
  useRef,
} from "react";
import { generateRandomStr } from "hsu-utils";
import styles from "./index.module.scss";
import classNames from "classnames";
import TitleSearchBar from "./_components/TitleSearchBar";
import { useTreeSearch } from "./_hooks/useTreeSearch";
import { useExpandedKeys, useCheckedKeys } from "./_hooks/useTreeState";
import { useTreeCheck } from "./_hooks/useTreeCheck";
import { useClearNodeTitle } from "./_hooks/useClearNodeTitle";
import { InputProps } from "../Input";
import { ButtonProps } from "../Button";
import { getExpandedKeysByLevel, getNodePath } from "./_utils";
import TextEllipsis from "../TextEllipsis";
import usePermissions from "../../hooks/usePermissions";
import { isLegacyHasSelectorBrowser } from "../../utils/cssSupports";

export interface TreeData extends Record<string, unknown> {
  title: string;
  key: string | number;
  value: string | number;
  selectable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  isLeaf?: boolean;
  checkable?: boolean;
  icon?: ReactNode;
  children?: TreeData[];
}

export interface CheckedObject {
  checked: React.Key[];
  halfChecked: React.Key[];
}

export type CheckedKeys = React.Key[] | CheckedObject;

export interface TreeProps extends Omit<
  AntdTreeProps,
  "treeData" | "loadData" | "loadedKeys" | "titleRender"
> {
  titleRender?: (data: TreeData) => ReactNode;
  treeClassName?: string;
  treeContainerClassName?: string;
  titleClassName?: string;
  title?: ReactNode;
  search?: boolean;
  treeData?: TreeData[];
  onChange?: (checked: CheckedKeys) => void;
  searchProps?: InputProps;
  indent?: number;
  switchWidth?: number;
  switchGap?: number;
  hideLeafExpand?: boolean;
  buttonGroup?: ButtonProps[];
  btnPosition?: "left" | "right";
  /** Default expand level (starting from 1: 1 means the first level, 2 the second, and so on) */
  defaultExpandLevel?: number;
  hasPermi?: string[];
  /** Callback when a node is selected, returns the full path of the selected node */
  onSelectPath?: (path: TreeData[] | null, selectedKeys: Key[]) => void;
  /** Whether clicking an already selected node deselects it; defaults to true (deselection allowed) */
  allowDeselect?: boolean;
  titleSearchBarClassName?: string;
}

interface TreeFC extends React.FC<TreeProps> {
  /** antd 的目录树（带文件夹图标与目录态选中） */
  DirectoryTree: typeof AntdTree.DirectoryTree;
  /** antd 的 `Tree.TreeNode`，供 JSX 写法（本库更推荐用 `treeData`） */
  TreeNode: typeof AntdTree.TreeNode;
}

const Tree = ((props: TreeProps) => {
  const {
    title,
    titleRender,
    treeClassName,
    treeContainerClassName,
    titleClassName,
    className,
    search,
    treeData = [],
    onChange,
    onCheck,
    onSelect,
    searchProps,
    indent,
    switchWidth,
    switchGap,
    hideLeafExpand,
    expandedKeys: expandedKeysProps,
    defaultExpandedKeys,
    defaultExpandLevel,
    checkedKeys: checkedKeysProps,
    selectedKeys: selectedKeysProps,
    defaultSelectedKeys,
    buttonGroup,
    btnPosition = "right",
    hasPermi,
    onSelectPath,
    allowDeselect = true,
    titleSearchBarClassName,
    ...treeConfig
  } = props;
  const { permitted } = usePermissions(hasPermi);
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  // Generate a unique class name (for style isolation)
  const cls = useMemo(() => generateRandomStr(10), []);
  // Compute the default expanded keys based on defaultExpandLevel
  // If both defaultExpandedKeys and defaultExpandLevel are provided, defaultExpandedKeys takes precedence
  const computedDefaultExpandedKeys = useMemo(() => {
    if (defaultExpandedKeys !== undefined) {
      return defaultExpandedKeys;
    }
    if (defaultExpandLevel !== undefined && defaultExpandLevel > 0) {
      return getExpandedKeysByLevel(treeData, defaultExpandLevel);
    }
    return undefined;
  }, [defaultExpandLevel, treeData, defaultExpandedKeys]);

  // Manage expanded state
  const [expandedKeys, setExpandedKeys] = useExpandedKeys(
    expandedKeysProps,
    computedDefaultExpandedKeys,
  );

  // Manage checked state (auto-normalized: a parent in checked whose children are not all checked becomes half-checked)
  const [checkedKeys, setCheckedKeys] = useCheckedKeys(
    checkedKeysProps,
    treeData,
  );

  // Manage selected state (used to support the allowDeselect feature)
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<Key[]>(
    defaultSelectedKeys ?? [],
  );

  // Controlled mode uses the externally provided selectedKeys; uncontrolled mode uses internal state
  const selectedKeys = selectedKeysProps ?? internalSelectedKeys;

  // Handle search
  const { searchKey, handleSearchChange, filteredTreeData } = useTreeSearch(
    treeData,
    setExpandedKeys,
  );

  // Handle checking (uses antd's default logic)
  const handleCheck = useTreeCheck(setCheckedKeys, onCheck, onChange);

  // Clear the node title attribute (prevents hover tooltip)
  useClearNodeTitle(filteredTreeData, cls);

  // Style object (CSS variables)
  const style = useMemo<CSSProperties>(
    () =>
      ({
        "--tree-indent-unit-width":
          typeof indent === "number" ? `${indent}px` : undefined,
        "--tree-switcher-width":
          typeof switchWidth === "number" ? `${switchWidth}px` : undefined,
        "--tree-switcher-gap":
          typeof switchGap === "number" ? `${switchGap}px` : undefined,
      }) as CSSProperties,
    [indent, switchWidth, switchGap],
  );

  // Store the latest onSelectPath callback and initialization flag in refs to avoid stale closures
  const onSelectPathRef = useRef(onSelectPath);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    onSelectPathRef.current = onSelectPath;
  }, [onSelectPath]);

  // Handle expand events
  const handleExpand = useCallback(
    (
      expandedKeys: Key[],
      info: Parameters<NonNullable<AntdTreeProps["onExpand"]>>[1],
    ) => {
      setExpandedKeys(expandedKeys);
      treeConfig.onExpand?.(expandedKeys, info);
    },
    [setExpandedKeys, treeConfig],
  );

  // Handle select events
  const handleSelect = useCallback(
    (
      selectedKeys: Key[],
      info: Parameters<NonNullable<AntdTreeProps["onSelect"]>>[1],
    ) => {
      let finalSelectedKeys = selectedKeys;

      // If deselection is not allowed and an already selected node was clicked
      // (info.selected being false means it is about to be deselected),
      // block the deselection and keep the node selected
      if (!allowDeselect && !info.selected && info.node.key) {
        finalSelectedKeys = [info.node.key];
      }

      // In uncontrolled mode, update internal state
      if (selectedKeysProps === undefined) {
        setInternalSelectedKeys(finalSelectedKeys);
      }

      onSelect?.(finalSelectedKeys, info);

      if (!onSelectPathRef.current) return;

      // Get the node path and invoke the callback
      const path =
        finalSelectedKeys.length > 0
          ? getNodePath(finalSelectedKeys[0], treeData)
          : null;
      onSelectPathRef.current(path, finalSelectedKeys);
    },
    [onSelect, treeData, allowDeselect, selectedKeysProps],
  );

  // Handle initially provided selectedKeys and defaultSelectedKeys
  useEffect(() => {
    if (!onSelectPathRef.current || !treeData.length) return;

    // Controlled mode: use selectedKeysProps
    if (selectedKeysProps !== undefined) {
      if (selectedKeysProps.length > 0) {
        const path = getNodePath(selectedKeysProps[0], treeData);
        onSelectPathRef.current(path, selectedKeysProps);
        isInitializedRef.current = true;
      } else if (isInitializedRef.current) {
        onSelectPathRef.current(null, selectedKeysProps);
      }
      return;
    }

    // Uncontrolled mode: only use defaultSelectedKeys on initialization
    if (
      !isInitializedRef.current &&
      defaultSelectedKeys &&
      defaultSelectedKeys.length > 0
    ) {
      const path = getNodePath(defaultSelectedKeys[0], treeData);
      onSelectPathRef.current(path, defaultSelectedKeys);
      isInitializedRef.current = true;
    }
  }, [defaultSelectedKeys, selectedKeysProps, treeData]);

  if (!permitted) {
    return null;
  }

  return (
    <div
      className={classNames(styles.Tree, className, {
        [styles.hideLeafExpand]: hideLeafExpand,
        [styles.legacyHasSelectedNodeBackground]: legacyHasSelector,
      })}
      style={style}
    >
      <TitleSearchBar
        titleClassName={titleClassName}
        title={title}
        search={search}
        searchValue={searchKey}
        onSearchChange={handleSearchChange}
        searchProps={searchProps}
        buttonGroup={buttonGroup}
        btnPosition={btnPosition}
        className={titleSearchBarClassName}
      />
      <div className={classNames(styles.treeContainer, treeContainerClassName)}>
        {filteredTreeData.length > 0 && (
          <AntdTree
            blockNode
            titleRender={(node) => {
              const data = node as unknown as TreeData;

              if (titleRender) {
                return titleRender(data);
              }

              return (
                <TextEllipsis containerStyle={{ display: "inline-flex" }}>
                  {data.title}
                </TextEllipsis>
              );
            }}
            {...treeConfig}
            className={classNames(treeClassName, cls)}
            treeData={filteredTreeData}
            onCheck={handleCheck}
            checkedKeys={checkedKeys}
            {...(expandedKeys !== undefined && { expandedKeys })}
            selectedKeys={selectedKeys}
            onExpand={handleExpand}
            onSelect={handleSelect}
            checkStrictly={false}
          />
        )}
      </div>
    </div>
  );
}) as TreeFC;

Tree.DirectoryTree = AntdTree.DirectoryTree;
Tree.TreeNode = AntdTree.TreeNode;

export default Tree;
