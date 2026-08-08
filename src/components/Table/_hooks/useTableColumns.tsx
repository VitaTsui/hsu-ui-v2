import { useCallback, useMemo, useEffect, useState } from "react";
import { ColumnsType, ColumnType, ColumnsGroupType, TableProps } from "..";
import { AnyObject } from "antd/es/_util/type";
import { TableRowSelection } from "antd/es/table/interface";
import { ColumnsType as AntColumnsType } from "antd/lib/table";
import { cloneDeep } from "lodash";
import { Tooltip } from "antd";
import Icon from "../../Icon";
import styles from "../index.module.scss";
import { SorterResult, TableCurrentDataSource } from "antd/es/table/interface";
import { TablePaginationConfig } from "antd/es/table/interface";
import { FilterValue } from "antd/es/table/interface";
import { get_string_size } from "hsu-utils";
import classNames from "classnames";
import {
  getDepartmentRowSpan,
  HELP_TOOLTIP_CONFIG,
} from "../_utils/tableUtils";
import usePermissions from "../../../hooks/usePermissions";
import { PaginationProps } from "../../Pagination";

// measureAlign columns: measured at 14px, consistent with the table body and autoWidth title measurement
const MEASURE_ALIGN_FONT_SIZE = 14;
// Canvas measureText only returns the advance width, about 1px narrower than the actual DOM rendering; add a 2px buffer to avoid squeezing the widest row
const MEASURE_ALIGN_BUFFER_PX = 2;
// Default total horizontal cell padding (default --td-padding: 4px 8px), used to raise the column width enough to fit the fixed-width content block
const MEASURE_ALIGN_CELL_PADDING_PX = 16;

/**
 * Parses the total horizontal padding from tdPadding (CSS padding shorthand);
 * falls back to the default when absent or unparsable (matching the default --td-padding: 4px 8px).
 */
const getCellHorizontalPadding = (tdPadding?: string): number => {
  if (!tdPadding) return MEASURE_ALIGN_CELL_PADDING_PX;

  const parts = tdPadding
    .trim()
    .split(/\s+/)
    .map((v) => parseFloat(v));
  if (!parts.length || parts.some((v) => Number.isNaN(v))) {
    return MEASURE_ALIGN_CELL_PADDING_PX;
  }

  // CSS shorthand: 1 value = all four sides; 2/3 values = the 2nd is left/right; 4 values = right + left
  if (parts.length === 1) return parts[0] * 2;
  if (parts.length === 4) return parts[1] + parts[3];
  return parts[1] * 2;
};

// Computes the fixed width for a measureAlign column (the max pixel width of the display text across all rows in the column)
const getMeasureAlignWidth = <T extends AnyObject>(
  column: ColumnType<T>,
  dataSource?: readonly T[]
): number => {
  if (!dataSource?.length) return 0;
  const { measureText, dataIndex } = column;
  const max = dataSource.reduce((acc, record) => {
    const text = measureText
      ? measureText(record)
      : String((dataIndex ? record[dataIndex] : "") ?? "");
    return Math.max(
      acc,
      get_string_size(text, { size: MEASURE_ALIGN_FONT_SIZE }).width
    );
  }, 0);
  return max > 0 ? Math.ceil(max) + MEASURE_ALIGN_BUFFER_PX : 0;
};

interface UseTableColumnsParams<T extends AnyObject> {
  columns?: ColumnsType<T>;
  scroll?: boolean | { y: boolean };
  autoWidth?: boolean;
  dataSource?: TableProps<T>["dataSource"];
  enhanceColumns: (columns?: ColumnsType<T>) => ColumnsType<T> | undefined;
  serialNumberColumn?: boolean;
  pagination?: false | PaginationProps;
  _pageNum: number;
  _pageSize: number;
  order?: { k: string; t: "asc" | "desc" };
  mergeRowDataSource?: readonly T[] | undefined;
  onChange?: TableProps<T>["onChange"];
  onOrderChange?: (order?: { k: string; t: "asc" | "desc" }) => void;
  sorter?: boolean;
  ref?: React.RefObject<HTMLDivElement>;
  cls?: string;
  bordered?: boolean;
  rowSelection?: TableRowSelection<T>;
  expandable?: TableProps<T>["expandable"];
  tdPadding?: string;
}

const useTableColumns = <T extends AnyObject>(
  params: UseTableColumnsParams<T>
): {
  _columns: ColumnsType<T>;
  renderedColumns: ColumnsType<T> | undefined;
  handleTableChange: TableProps<T>["onChange"];
} => {
  const {
    columns = [],
    scroll,
    autoWidth,
    dataSource,
    enhanceColumns,
    serialNumberColumn = false,
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
  } = params;
  const { checkPermission } = usePermissions();
  const [tableWidth, setTableWidth] = useState<number | null>(null);

  // Observe table width changes
  useEffect(() => {
    if (ref?.current && cls) {
      const tableElement = document.querySelector(
        `.${cls} .ant-table`
      ) as HTMLElement;
      if (tableElement) {
        const updateWidth = () => {
          const width = tableElement.offsetWidth;
          if (width > 0) {
            setTableWidth(width);
          }
        };
        updateWidth();
        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(tableElement);
        return () => resizeObserver.disconnect();
      }
    }
  }, [ref, cls]);

  // Handle basic column setup (permissions, width, sorting, etc.)
  const _columns = useMemo(() => {
    const cloned = cloneDeep(columns);

    const newColumns = cloned
      ?.map((item, idx) => {
        return {
          ...item,
          width: !item.width ? "100%" : item.width,
          key: item.key ?? item.dataIndex ?? `col_${idx}`,
          hidden: !checkPermission(item.hasPermi) || item.hidden,
          ellipsis: typeof item.ellipsis === "boolean" ? item.ellipsis : true,
        };
      })
      ?.sort((a, b) => (a?.sort ?? 0) - (b?.sort ?? 0))
      ?.map((item) => {
        if (
          autoWidth &&
          item.width === "100%" &&
          scroll &&
          (typeof item.title === "string" || typeof item.title === "number")
        ) {
          let { width: titleWidth } = get_string_size(item.title?.toString(), {
            size: 14,
          });
          if (item.help) {
            titleWidth += 22;
          }

          const dataIndexWidth = item.dataIndex
            ? dataSource?.reduce((acc, cur) => {
                return Math.max(
                  acc,
                  get_string_size(cur[item.dataIndex!]?.toString(), {
                    size: 14,
                  }).width
                );
              }, 0) ?? 0
            : 0;
          item.width = Math.max(titleWidth, dataIndexWidth) + 32;
        }

        // measureAlign columns: the column width must fit the widest row's fixed-width content block
        // plus horizontal cell padding, otherwise very long values (e.g. +3357.52%) get truncated
        // by the column width; the declared width only serves as a lower bound.
        if (item.measureAlign && typeof item.width === "number") {
          const measured = getMeasureAlignWidth(
            item as ColumnType<T>,
            dataSource
          );
          if (measured > 0) {
            item.width = Math.max(
              item.width,
              measured + getCellHorizontalPadding(tdPadding)
            );
          }
        }

        return item;
      })
      ?.map((item) => {
        return {
          ...item,
          width: item.hidden ? 0.01 : item.width,
          className: classNames(item.className, {
            [styles.hidden]: item.hidden,
          }),
          hidden: undefined,
        };
      });

    return newColumns;
  }, [autoWidth, columns, dataSource, checkPermission, scroll, tdPadding]);

  // Render column titles
  const renderColumnTitle = useCallback(
    (column: ColumnType<T> | ColumnsGroupType<T>) => {
      const titleContent = column?.titleSort
        ? column.titleSort
        : column.renderTitle
        ? column.renderTitle(column.title || "")
        : column.title;

      if (!column.help) {
        return titleContent;
      }

      return (
        <>
          {titleContent}
          <Tooltip title={column.help} {...HELP_TOOLTIP_CONFIG}>
            <Icon
              icon="material-symbols:help"
              className={styles.help}
              fontSize={16}
              color="var(--vita-subtle-foreground)"
            />
          </Tooltip>
        </>
      );
    },
    []
  );

  const renderColumns = useCallback(
    (columns?: ColumnsType<T>): AntColumnsType<T> | undefined => {
      // First enhance the column config, adding an automatic Tooltip for ellipsis columns
      let enhancedColumns = enhanceColumns(columns);

      if (serialNumberColumn && !_columns.find((v) => !!v.children)) {
        enhancedColumns?.unshift({
          title: "序号",
          dataIndex: "serialNumber",
          width: 60,
          align: "center",
          render: (_, __, index) => {
            return pagination
              ? (_pageNum - 1) * _pageSize + (index + 1)
              : index + 1;
          },
          fixedWidth: true,
        });
      }

      // Handle width allocation for fixedWidth columns (based on enhancedColumns)
      if (enhancedColumns && tableWidth && tableWidth > 0) {
        // Check whether any column has fixedWidth set to true
        const hasFixedWidth = enhancedColumns.some(
          (col) => col.fixedWidth === true
        );

        if (hasFixedWidth) {
          // Filter out visible columns (excluding hidden columns, i.e. those with width 0.01)
          const visibleColumns = enhancedColumns.filter(
            (col) => typeof col.width === "number" && col.width > 0.01
          );

          // Check whether all visible columns have a width (not "100%")
          const allHaveWidth = visibleColumns.every(
            (col) =>
              col.width && col.width !== "100%" && typeof col.width === "number"
          );

          if (allHaveWidth && visibleColumns.length > 0) {
            // Compute the total width of all visible columns
            const totalWidth = visibleColumns.reduce((sum, col) => {
              const width = typeof col.width === "number" ? col.width : 0;
              return sum + width;
            }, 0);

            // If the total is less than the table width, distribute proportionally to visible non-fixedWidth columns
            // When bordered is true, subtract 2 from tableWidth (border width)
            // When rowSelection is present, subtract 48 from tableWidth (selection column width)
            let adjustedTableWidth = bordered ? tableWidth - 2 : tableWidth;
            if (rowSelection) {
              adjustedTableWidth -= 48;
            }
            if (expandable) {
              adjustedTableWidth -= 48;
            }
            if (totalWidth < adjustedTableWidth) {
              const extraWidth = adjustedTableWidth - totalWidth;
              const nonFixedWidthColumns = visibleColumns.filter(
                (col) => col.fixedWidth !== true
              );
              const nonFixedWidthTotal = nonFixedWidthColumns.reduce(
                (sum, col) => {
                  const width = typeof col.width === "number" ? col.width : 0;
                  return sum + width;
                },
                0
              );

              if (nonFixedWidthTotal > 0) {
                // Distribute the extra width proportionally
                enhancedColumns = enhancedColumns?.map((col) => {
                  // hidden columns (width 0.01) and fixedWidth columns keep their original width
                  const currentWidth =
                    typeof col.width === "number" ? col.width : 0;
                  if (col.fixedWidth === true || currentWidth <= 0.01) {
                    return col;
                  }
                  const ratio = currentWidth / nonFixedWidthTotal;
                  const additionalWidth = extraWidth * ratio;
                  return {
                    ...col,
                    width: +(currentWidth + additionalWidth).toFixed(2),
                  };
                });
              }
            }
          }
        }
      }

      return enhancedColumns?.map((column) => {
        const orderKey = column.orderKey || column.dataIndex;
        const isOrderColumn = orderKey && orderKey !== "serialNumber";

        // measureAlign columns: wrap the display content in a fixed-width right-aligned block
        // (the block is centered per the column align), so all rows' right edges align.
        // Not applicable to merged-cell scenarios where render returns a RenderedCell like { children, rowSpan }.
        let render = column.render;
        if (column.measureAlign) {
          const cellWidth = getMeasureAlignWidth(
            column as ColumnType<T>,
            dataSource
          );
          if (cellWidth > 0) {
            const innerRender = column.render;
            render = (value: unknown, record: T, index: number) => (
              <span
                style={{
                  display: "inline-block",
                  width: cellWidth,
                  textAlign: "right",
                }}
              >
                {
                  (innerRender
                    ? innerRender(value, record, index)
                    : value) as React.ReactNode
                }
              </span>
            );
          }
        }

        return {
          showSorterTooltip: false,
          sorter:
            typeof sorter === "boolean" ? sorter : isOrderColumn ? true : false,
          ...column,
          orderKey,
          title: renderColumnTitle(column),
          render,
          children: column?.children
            ? renderColumns(column.children)
            : undefined,
          onCell: (record, index) => {
            const cell = column?.onCell?.(record, index);
            let rowSpan = 1;

            if (column.mergeRow) {
              rowSpan = getDepartmentRowSpan(
                record as unknown as Record<string, unknown>,
                index as number,
                mergeRowDataSource as unknown as Record<string, unknown>[],
                column.dataIndex as string
              );
            }

            return {
              rowSpan,
              ...cell,
            };
          },
          sortOrder:
            order?.k === orderKey
              ? order?.t === "desc"
                ? "descend"
                : "ascend"
              : undefined,
        };
      });
    },
    [
      enhanceColumns,
      serialNumberColumn,
      _columns,
      tableWidth,
      pagination,
      _pageNum,
      _pageSize,
      bordered,
      rowSelection,
      expandable,
      sorter,
      renderColumnTitle,
      order,
      mergeRowDataSource,
      dataSource,
    ]
  );

  // Cache the rendered column config
  const renderedColumns = useMemo(
    () => renderColumns(cloneDeep(_columns)),
    [renderColumns, _columns]
  );

  // Handle sort changes
  const handleTableChange = useCallback(
    (
      pagination: TablePaginationConfig,
      filters: Record<string, FilterValue | null>,
      sorter: SorterResult<T> | SorterResult<T>[],
      extra: TableCurrentDataSource<T>
    ) => {
      onChange?.(pagination, filters, sorter, extra);
      const sorterResult = Array.isArray(sorter) ? sorter[0] : sorter;
      const { column, order: _order } = sorterResult;
      const columnOrderKey = (column as ColumnType<T>)?.orderKey;
      const k = columnOrderKey ?? order?.k;

      if (!k || !_order) {
        onOrderChange?.(undefined);
      } else {
        const t = _order === "ascend" ? "asc" : "desc";

        onOrderChange?.({ k, t });
      }
    },
    [onChange, onOrderChange, order]
  );

  return {
    _columns: _columns as ColumnsType<T>,
    renderedColumns: renderedColumns as ColumnsType<T> | undefined,
    handleTableChange,
  };
};

export default useTableColumns;
