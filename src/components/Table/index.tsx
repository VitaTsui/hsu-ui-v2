import {
  ColumnType as AntColumnType,
  ColumnGroupType as AntColumnGroupType,
} from "antd/lib/table";
import {
  Table as AntdTable,
  TableProps as AntdTableProps,
  TooltipProps,
} from "antd";
import Drag, { DragProps } from "./_components/Drag";
import Pagination, { PaginationProps } from "../Pagination";
import React, { CSSProperties, ReactNode, useMemo, useRef } from "react";

import { AnyObject } from "antd/es/_util/type";
import { generateRandomStr } from "hsu-utils";
import classNames from "classnames";
import styles from "./index.module.scss";
import useHideHeaderScrollbar from "./_hooks/useHideHeaderScrollbar";
import useSetTableHeight from "./_hooks/useSetTableHeight";
import { ColumnTitleProps } from "antd/lib/table/interface";
import useAutoScrolling from "./_hooks/useAutoScrolling";
import useScrollEnd from "./_hooks/useScrollEnd";
import useEllipsisTooltip from "./_hooks/useEllipsisTooltip";
import useTablePagination from "./_hooks/useTablePagination";
import useTableColumns from "./_hooks/useTableColumns";

export { Drag as TableDrag };

export interface EllipsisTooltipConfig
  extends Omit<TooltipProps, "title" | "children"> {
  ellipsisPosition?: "start" | "end";
  defaultWidth?: number; // Default Tooltip width (used when the column has no width set)
}

export interface ColumnType<RecordType> extends AntColumnType<RecordType> {
  title?: string;
  renderTitle?: (title: string) => ReactNode;
  titleSort?: (props: ColumnTitleProps<RecordType>) => ReactNode;
  dataIndex?: string;
  hidden?: boolean;
  sort?: number;
  hasPermi?: string[];
  children?: ColumnType<RecordType>[];
  mergeRow?: boolean;
  help?: string;
  orderKey?: string;
  fixedWidth?: boolean;
  ellipsisPosition?: "start" | "end";
  /**
   * Fixed-width aligned column: the column title is centered per align, and cell content
   * is placed right-aligned inside a fixed-width block measured from the column's widest
   * content, so all rows' right edges align and the block is centered within the column
   * (suitable for number/amount columns).
   */
  measureAlign?: boolean;
  /**
   * Text used to measure the width of a measureAlign column. Defaults to the raw dataIndex
   * value; when the cell renders composite/JSX content via render (so the display text cannot
   * be derived from dataIndex directly), use this to provide text matching what is displayed.
   */
  measureText?: (record: RecordType) => string;
}
export interface ColumnsGroupType<RecordType>
  extends Omit<AntColumnGroupType<RecordType>, "children"> {
  title?: string;
  renderTitle?: (title: string) => ReactNode;
  titleSort?: (props: ColumnTitleProps<RecordType>) => ReactNode;
  dataIndex?: string;
  hidden?: boolean;
  sort?: number;
  hasPermi?: string[];
  children?: ColumnsGroupType<RecordType>[];
  mergeRow?: boolean;
  help?: string;
  orderKey?: string;
  fixedWidth?: boolean;
  ellipsisPosition?: "start" | "end";
  measureAlign?: boolean;
  measureText?: (record: RecordType) => string;
}
export type ColumnsType<RecordType = AnyObject> = (
  | ColumnType<RecordType>
  | ColumnsGroupType<RecordType>
)[];

export interface TableProps<RecordType = AnyObject>
  extends Omit<
    AntdTableProps<RecordType>,
    "scroll" | "pagination" | "columns"
  > {
  columns?: ColumnsType<RecordType>;
  scroll?: boolean | { y: boolean };
  autoWidth?: boolean;
  scrollAutoHeight?: boolean;
  hideScrollbar?: boolean;
  thPadding?: string;
  tdPadding?: string;
  expandedCellPadding?: string;
  pagination?: false | PaginationProps;
  onDragEnd?: DragProps["onDragEnd"];
  tableClassName?: string;
  fillPanel?: boolean;
  staticDataSource?: boolean;
  antdTableClassName?: string;
  autoScrolling?: boolean;
  autoScrollingInterval?: number;
  /** Auto-scroll speed in smooth mode, in px/s, default 25 */
  autoScrollingSpeed?: number;
  autoScrollMode?: "smooth" | "row";
  /** Whether to loop back to the top after auto-scrolling to the end, default true */
  autoScrollLoop?: boolean;
  /** Loop mode: "reset" returns to the top and scrolls again (default), "seamless" continues scrolling without a visible jump */
  autoScrollLoopMode?: "reset" | "seamless";
  /** Auto-scroll offset threshold (px); auto-scrolling starts only when the scrollable overflow exceeds this value, default 0 */
  autoScrollingOffset?: number;
  hideEmpty?: boolean;
  ellipsisTooltipConfig?: EllipsisTooltipConfig;
  serialNumberColumn?: boolean;
  onAutoScrollEndAdd?: () => Promise<boolean>;
  onScrollEnd?: () => void;
  order?: { k: string; t: "asc" | "desc" };
  onOrderChange?: (order?: { k: string; t: "asc" | "desc" }) => void;
  sorter?: boolean;
  showTotal?: false | ((total: number, range: [number, number]) => ReactNode);
  isExpandedCellTable?: boolean;
}

type TableFC = (<T extends AnyObject>(
  props: TableProps<T>
) => JSX.Element | null) &
  React.FC<TableProps<AnyObject>> & {
    /** antd 的 `Table.Summary`，用来渲染合计行 */
    Summary: typeof AntdTable.Summary;
    /** antd 的 `Table.Column`，供 JSX 声明列（本库更推荐用 `columns` 属性） */
    Column: typeof AntdTable.Column;
    /** antd 的 `Table.ColumnGroup` */
    ColumnGroup: typeof AntdTable.ColumnGroup;
    /** 展开列的占位符，放进 `columns` 里可指定展开图标的位置 */
    EXPAND_COLUMN: typeof AntdTable.EXPAND_COLUMN;
    /** 选择列的占位符，同上 */
    SELECTION_COLUMN: typeof AntdTable.SELECTION_COLUMN;
    SELECTION_ALL: typeof AntdTable.SELECTION_ALL;
    SELECTION_INVERT: typeof AntdTable.SELECTION_INVERT;
    SELECTION_NONE: typeof AntdTable.SELECTION_NONE;
    /** 拖拽排序：`Table.Drag.Handle` 作为拖拽手柄列 */
    Drag: typeof Drag;
  };

const Table: TableFC = <T extends AnyObject>(props: TableProps<T>) => {
  const {
    scroll = false,
    pagination = {},
    className,
    dataSource,
    columns = [],
    autoWidth,
    expandable = {},
    scrollAutoHeight = true,
    hideScrollbar = true,
    thPadding,
    tdPadding,
    expandedCellPadding,
    onDragEnd,
    tableClassName,
    fillPanel,
    staticDataSource = false,
    id,
    antdTableClassName,
    autoScrolling,
    autoScrollingInterval: interval,
    autoScrollingSpeed,
    autoScrollMode,
    autoScrollLoop = true,
    autoScrollLoopMode,
    autoScrollingOffset,
    hideEmpty = false,
    ellipsisTooltipConfig,
    serialNumberColumn = false,
    onAutoScrollEndAdd,
    onScrollEnd,
    bordered,
    order,
    onOrderChange,
    onChange,
    sorter,
    virtual,
    showTotal,
    rowSelection,
    isExpandedCellTable = false,
    ...TableConfig
  } = props;
  const {
    pageSize,
    current,
    total,
    onChange: onChangePage,
    onShowSizeChange,
    onStaticPaginationChange,
    ...paginationConfig
  } = typeof pagination === "boolean" ? ({} as PaginationProps) : pagination;
  const ref = useRef<HTMLDivElement>(null);
  const cls = useMemo(() => generateRandomStr(10), []);

  const { enhanceColumns } = useEllipsisTooltip<T>(ellipsisTooltipConfig);

  const {
    _pageNum,
    _pageSize,
    paginatedDataSource,
    mergeRowDataSource,
    handlePageChange,
    handlePageSizeChange,
  } = useTablePagination({
    dataSource,
    pagination,
    staticDataSource,
    current,
    pageSize,
    onChangePage,
    onShowSizeChange,
    onStaticPaginationChange,
  });

  const { _columns, renderedColumns, handleTableChange } = useTableColumns({
    columns,
    scroll,
    autoWidth,
    dataSource,
    enhanceColumns,
    serialNumberColumn,
    pagination,
    _pageNum,
    _pageSize,
    order,
    mergeRowDataSource,
    onChange,
    onOrderChange,
    sorter,
    ref,
    cls,
    bordered,
    rowSelection,
    expandable,
    tdPadding,
  });

  useSetTableHeight({
    pagination,
    scroll,
    scrollAutoHeight,
    ref,
    dataSource,
    cls,
    fillPanel,
    columns: _columns,
    bordered,
    virtual,
  });

  useHideHeaderScrollbar({
    hideScrollbar,
    cls,
    ref,
    scroll,
    bordered,
  });

  useAutoScrolling({
    cls,
    autoScrolling,
    ref,
    dataSource,
    interval,
    autoScrollingSpeed,
    onAutoScrollEndAdd,
    autoScrollMode,
    autoScrollLoop,
    autoScrollLoopMode,
    autoScrollingOffset,
  });

  useScrollEnd({
    cls,
    ref,
    dataSource,
    onScrollEnd,
    autoScrolling,
  });

  if (!_columns.length) {
    return null;
  }

  const isScrollEnabled = Boolean(scroll && !virtual);
  const isScrollYDisabled =
    typeof scroll === "object" && scroll.y === false && !virtual;

  return (
    <Drag rowKey={props.rowKey} dataSource={dataSource} onDragEnd={onDragEnd}>
      <div
        className={classNames(styles.Table, className, cls)}
        ref={ref}
        id={id}
        style={
          {
            "--th-padding": thPadding,
            "--td-padding": tdPadding,
            "--expanded-cell-padding": expandedCellPadding || tdPadding,
          } as CSSProperties
        }
      >
        <div
          className={classNames(styles.antdTable, tableClassName, {
            [styles.scroll]: isScrollEnabled,
            [styles["y-unScroll"]]: isScrollYDisabled,
            [styles.hideScrollbar]: hideScrollbar,
            [styles.hideEmpty]: hideEmpty,
            [styles.isExpandedCellTable]: isExpandedCellTable,
          })}
        >
          <AntdTable
            {...TableConfig}
            bordered={bordered}
            components={onDragEnd ? { body: { row: Drag.Row } } : undefined}
            dataSource={paginatedDataSource}
            columns={renderedColumns}
            pagination={false}
            scroll={isScrollEnabled ? { y: "" } : undefined}
            expandable={
              expandable ? { ...expandable, columnWidth: 48 } : undefined
            }
            className={antdTableClassName}
            onChange={handleTableChange}
            virtual={virtual}
            rowSelection={
              rowSelection ? { ...rowSelection, columnWidth: 48 } : undefined
            }
          />
        </div>
        {pagination && (
          <Pagination
            pageSize={_pageSize}
            current={_pageNum}
            total={total || dataSource?.length}
            listLength={dataSource?.length}
            onChange={handlePageChange}
            size="small"
            showQuickJumper={true}
            onShowSizeChange={handlePageSizeChange}
            showSizeChanger={true}
            pageSizeOptions={[10, 20, 50, 100, 200]}
            showTotal={
              showTotal === false
                ? undefined
                : showTotal
                ? showTotal
                : (total) => `共 ${total} 条数据`
            }
            {...paginationConfig}
          />
        )}
      </div>
    </Drag>
  );
};

Table.Summary = AntdTable.Summary;
Table.Column = AntdTable.Column;
Table.ColumnGroup = AntdTable.ColumnGroup;
Table.EXPAND_COLUMN = AntdTable.EXPAND_COLUMN;
Table.SELECTION_COLUMN = AntdTable.SELECTION_COLUMN;
Table.SELECTION_ALL = AntdTable.SELECTION_ALL;
Table.SELECTION_INVERT = AntdTable.SELECTION_INVERT;
Table.SELECTION_NONE = AntdTable.SELECTION_NONE;
Table.Drag = Drag;

export default Table;
