import type { TableProps, ColumnsType } from "..";
import type { AnyObject } from "antd/es/_util/type";

/** Keep tree expand buttons out of the serial-number cell. */
export function separateExpandColumn<T extends AnyObject>(
  columns: ColumnsType<T> | undefined,
  expandable: TableProps<T>["expandable"],
  dataSource: TableProps<T>["dataSource"],
  expandColumn: ColumnsType<T>[number],
): {
  columns: ColumnsType<T> | undefined;
  expandable: NonNullable<TableProps<T>["expandable"]>;
} {
  const config = { ...expandable, columnWidth: 48 };
  if (expandable?.showExpandColumn === false) {
    return { columns, expandable: config };
  }

  if (expandable?.expandedRowRender) {
    const { expandIconColumnIndex: _index, ...rowConfig } = config;
    return {
      columns: [expandColumn, ...(columns || []).filter(col => col !== expandColumn)],
      expandable: { ...rowConfig, fixed: "left" },
    };
  }

  const childrenKey = expandable?.childrenColumnName || "children";
  const hasTreeRows = dataSource?.some(row => Array.isArray(row[childrenKey]));
  if (!hasTreeRows) return { columns, expandable: config };

  return {
    columns: [
      {
        key: "__hsu_expand__",
        width: 48,
        fixed: "left" as const,
        align: "center" as const,
        sorter: false,
        render: () => null,
      },
      ...(columns || []),
    ],
    expandable: { ...config, fixed: "left", expandIconColumnIndex: 0 },
  };
}
