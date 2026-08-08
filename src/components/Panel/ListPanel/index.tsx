import { Breadcrumb, BreadcrumbProps } from "antd";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Search, {
  SearchModeKeys,
  SearchModePropsMap,
} from "../../Search";
import Table, { ColumnsType, TableProps } from "../../Table";
import { BasicButtonProps as BasicButtonProps } from "../../Button";
import TabBar, { TabBarProps } from "../../TabBar";
import classNames from "classnames";
import { cloneDeep } from "lodash";
import styles from "./index.module.scss";
import usePermissions from "../../../hooks/usePermissions";
import Tree, { TreeProps } from "../../Tree";
import ToolBar from "./_components/ToolBar";
import ColumnMgt from "./_components/ColumnMgt";
import ListModalPanel, { ListModalPanelProps } from "./ListModalPanel";
import { Equal } from "hsu-utils";
import { isLegacyHasSelectorBrowser } from "../../../utils/cssSupports";

interface ButtonProps extends Omit<BasicButtonProps, "children" | "title"> {
  title?: ReactNode;
  children?: ReactNode;
}

interface TableTools {
  onTableRefresh?: () => void;
  columnMgt?: IColumnMgt;
}

export interface ListPanelTabelProps extends Omit<TableProps, "title"> {
  /** Key passed through to the inner Table, used to force-remount the table when switching between heterogeneous column sets */
  key?: React.Key;
  title?: string;
  buttonGroup?: ButtonProps[];
  tabBarProps?: TabBarProps;
  tableTools?: TableTools;
  tableContainerClassName?: string;
  tips?: ReactNode;
  otherTool?: ReactNode;
}

interface ColumnMgtDataSource {
  hidden: boolean;
  title: string;
  dataIndex: string;
  sort: number;
  width?: number;
  ellipsis?: boolean;
}

export interface IColumnMgt {
  columnCount?: {
    max?: number;
    min?: number;
  };
  fixedDisplay?: string[];
  fixedPosition?: string[];
  onSelectionChange?: (
    selectedDataIndexes: string[],
    dataSource: Array<ColumnMgtDataSource>,
  ) => void;
}

export interface ListPanelProps<T extends SearchModeKeys = "Default"> {
  className?: string;
  wrapperClassName?: string;
  headerTabBarProps?: TabBarProps;
  headerTabBarContainerClassName?: string;
  headerTabBarChildren?: ReactNode;
  treeProps?: TreeProps;
  searchProps?: SearchModePropsMap[T];
  /** Search component mode: default-basic | Advanced-advanced filtering | Collapsible-collapsible | WithFilter-with filter | WithMore-with more items | Card-card style */
  searchMode?: T;
  tableProps?: ListPanelTabelProps;
  hasPermi?: string[];
  baseTreeBreadcrumb?: BreadcrumbProps["items"];
  showTreeBreadcrumb?: boolean;
  treeResize?: {
    enabled?: boolean;
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
    minContentWidth?: number;
  };
}

export interface ListPanelFC extends React.FC<ListPanelProps<SearchModeKeys>> {
  Modal: React.FC<ListModalPanelProps<SearchModeKeys>>;
}

const ListPanel: ListPanelFC = (props) => {
  const {
    className,
    wrapperClassName,
    headerTabBarProps,
    headerTabBarContainerClassName,
    headerTabBarChildren,
    treeProps = {},
    searchProps,
    searchMode = "Default",
    tableProps = {},
    hasPermi,
    baseTreeBreadcrumb,
    showTreeBreadcrumb = true,
    treeResize = {},
  } = props;
  const {
    enabled: treeResizeEnabled = true,
    defaultWidth: treeDefaultWidth = 250,
    minWidth: treeMinWidth = treeDefaultWidth,
    maxWidth: treeMaxWidth,
    minContentWidth: treeMinContentWidth = 520,
  } = treeResize;
  const {
    title,
    buttonGroup,
    className: tableClassName,
    columns,
    tabBarProps,
    tableTools = {},
    tableContainerClassName,
    tips,
    otherTool,
    // Key used to force-remount the table when switching between heterogeneous column sets; extracted
    // explicitly so it is not spread into JSX via ...tableConfig, which triggers React's "key prop being spread" warning
    key: tableInstanceKey,
    ...tableConfig
  } = tableProps;
  const { className: treeClassName, ...treeConfig } = treeProps;
  const hasTree = !!Object.keys(treeConfig).length;
  const hasHeaderTabBar = !!headerTabBarProps?.tabGroup?.length;
  const legacyHasSelector = isLegacyHasSelectorBrowser();
  const { columnMgt } = tableTools;
  const { permitted } = usePermissions(hasPermi);
  const [_columns, setColumns] = useState<ColumnsType | undefined>(columns);
  const [showColumnMgt, setShowColumnMgt] = useState<boolean>(false);
  const [treeWidth, setTreeWidth] = useState<number>(treeDefaultWidth);
  const [treeBreadcrumb, setTreeBreadcrumb] = useState<
    BreadcrumbProps["items"]
  >(baseTreeBreadcrumb ? cloneDeep(baseTreeBreadcrumb) : []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );
  const [isTreeResizing, setIsTreeResizing] = useState<boolean>(false);
  const [legacyHasSearch, setLegacyHasSearch] = useState<boolean>(true);

  const getClampedTreeWidth = useCallback(
    (nextWidth: number) => {
      const wrapperWidth = wrapperRef.current?.clientWidth;
      const maxWidthByContainer =
        typeof wrapperWidth === "number" && wrapperWidth > 0
          ? Math.max(treeMinWidth, wrapperWidth - treeMinContentWidth)
          : Number.POSITIVE_INFINITY;
      const finalMaxWidth =
        typeof treeMaxWidth === "number"
          ? Math.max(treeMinWidth, Math.min(treeMaxWidth, maxWidthByContainer))
          : maxWidthByContainer;

      return Math.min(Math.max(nextWidth, treeMinWidth), finalMaxWidth);
    },
    [treeMaxWidth, treeMinContentWidth, treeMinWidth],
  );

  const handleTreeResize = useCallback(
    (event: MouseEvent) => {
      if (!resizeStateRef.current) {
        return;
      }

      const { startX, startWidth } = resizeStateRef.current;
      const deltaX = event.clientX - startX;
      setTreeWidth(getClampedTreeWidth(startWidth + deltaX));
    },
    [getClampedTreeWidth],
  );

  const stopTreeResize = useCallback(() => {
    resizeStateRef.current = null;
    setIsTreeResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleTreeResize);
    window.removeEventListener("mouseup", stopTreeResize);
  }, [handleTreeResize]);

  const startTreeResize = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !hasTree || !treeResizeEnabled) {
        return;
      }

      event.preventDefault();
      resizeStateRef.current = {
        startX: event.clientX,
        startWidth: treeWidth,
      };
      setIsTreeResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleTreeResize);
      window.addEventListener("mouseup", stopTreeResize);
    },
    [handleTreeResize, hasTree, stopTreeResize, treeResizeEnabled, treeWidth],
  );

  useEffect(() => {
    if (columnMgt && columns?.length) {
      const _columns = columns?.map((col) => {
        return {
          ...col,
          sort: !col?.dataIndex
            ? typeof col.sort === "number"
              ? col.sort
              : 999
            : 0,
        };
      });

      setColumns(_columns);
    } else {
      setColumns(columns);
    }
  }, [columnMgt, columns]);

  useEffect(() => {
    if (!hasTree) {
      return;
    }

    setTreeWidth(getClampedTreeWidth(treeDefaultWidth));
  }, [getClampedTreeWidth, hasTree, treeDefaultWidth]);

  useEffect(() => {
    if (!hasTree || !treeResizeEnabled) {
      return;
    }

    const onResize = () => {
      setTreeWidth((prev) => getClampedTreeWidth(prev));
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [getClampedTreeWidth, hasTree, treeResizeEnabled]);

  useEffect(() => {
    return () => {
      stopTreeResize();
    };
  }, [stopTreeResize]);

  useEffect(() => {
    if (!legacyHasSelector || !hasHeaderTabBar) {
      return;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const updateLegacySearchState = () => {
      setLegacyHasSearch(!!wrapper.querySelector(`.${styles.search}`));
    };

    updateLegacySearchState();

    if (typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(updateLegacySearchState);
    observer.observe(wrapper, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [hasHeaderTabBar, legacyHasSelector, searchMode, searchProps]);

  // Render the matching Search component based on searchMode
  const SearchComponent = useMemo(() => {
    const searchClassName = classNames(searchProps?.className, styles.search);

    switch (searchMode) {
      case "Advanced":
        return (
          <Search.Advanced
            baseWidth={1670}
            {...(searchProps as SearchModePropsMap["Advanced"])}
            className={searchClassName}
          />
        );
      case "Collapsible":
        return (
          <Search.Collapsible
            baseWidth={1670}
            {...(searchProps as SearchModePropsMap["Collapsible"])}
            className={searchClassName}
          />
        );
      case "WithFilter":
        return (
          <Search.WithFilter
            baseWidth={1670}
            {...(searchProps as SearchModePropsMap["WithFilter"])}
            className={searchClassName}
          />
        );
      case "WithMore":
        return (
          <Search.WithMore
            baseWidth={1670}
            {...(searchProps as SearchModePropsMap["WithMore"])}
            className={searchClassName}
          />
        );
      case "Card":
        return (
          <Search.Card
            {...(searchProps as SearchModePropsMap["Card"])}
            className={searchClassName}
          />
        );
      default:
        return (
          <Search
            baseWidth={1670}
            {...(searchProps as SearchModePropsMap["Default"])}
            className={searchClassName}
          />
        );
    }
  }, [searchMode, searchProps]);

  if (!permitted) {
    return null;
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className={classNames(styles.ListPanelWrapper, wrapperClassName)}
      >
        {hasTree && (
          <div
            className={styles.treeWrapper}
            style={{ width: `${treeWidth}px` }}
          >
            <Tree
              {...treeConfig}
              className={classNames(treeClassName, styles.ListPanelTree)}
              onSelectPath={(path, selectedKeys) => {
                treeConfig.onSelectPath?.(path, selectedKeys);

                setTreeBreadcrumb([
                  ...(baseTreeBreadcrumb || []),
                  ...(path?.map((item) => {
                    return {
                      title: item.title,
                    };
                  }) || []),
                ]);
              }}
            />
            {treeResizeEnabled && (
              <div
                className={classNames(styles.treeResizeHandle, {
                  [styles.resizing]: isTreeResizing,
                })}
                onMouseDown={startTreeResize}
                onDoubleClick={() =>
                  setTreeWidth(getClampedTreeWidth(treeDefaultWidth))
                }
              />
            )}
          </div>
        )}
        <div
          className={classNames(styles.ListPanel, className, {
            [styles.hasHeaderTabBar]: hasHeaderTabBar,
            [styles.legacyNoSearch]:
              legacyHasSelector && hasHeaderTabBar && !legacyHasSearch,
          })}
        >
          {hasTree &&
            showTreeBreadcrumb &&
            !!treeBreadcrumb?.length && <Breadcrumb items={treeBreadcrumb} />}
          {!!headerTabBarProps?.tabGroup?.length && (
            <div
              className={classNames(
                styles.headerTabBarContainer,
                headerTabBarContainerClassName,
              )}
            >
              <TabBar
                {...headerTabBarProps}
                className={classNames(
                  headerTabBarProps.className,
                  styles.headerTabBar,
                )}
              />
              {headerTabBarChildren}
            </div>
          )}
          {SearchComponent}
          {!title &&
            Equal.ValEqual(tabBarProps ?? {}, {}) &&
            !buttonGroup?.length &&
            Equal.ValEqual(tableTools ?? {}, {}) &&
            tips && <div className={styles.tips}>{tips}</div>}
          <div
            className={classNames(
              styles.tableContainer,
              tableContainerClassName,
            )}
          >
            <ToolBar
              columns={columns}
              title={title}
              tabBarProps={tabBarProps}
              buttonGroup={buttonGroup}
              tableTools={tableTools}
              setShowColumnMgt={setShowColumnMgt}
              tips={tips}
              otherTool={otherTool}
            />
            <Table
              key={tableInstanceKey}
              className={`${styles.table} ${tableClassName ?? ""}`}
              {...{
                scroll: true,
                serialNumberColumn: true,
                bordered: true,
                fillPanel: true,
                ...tableConfig,
                columns: _columns,
              }}
            />
          </div>
        </div>
      </div>
      <ColumnMgt
        open={showColumnMgt}
        onClose={() => setShowColumnMgt(false)}
        onOk={(columns) => setColumns(cloneDeep(columns))}
        columns={_columns}
        defaultColumns={columns}
        onSelectionChange={columnMgt?.onSelectionChange}
        {...columnMgt}
      />
    </>
  );
};

ListPanel.Modal = ListModalPanel;

export default ListPanel;
