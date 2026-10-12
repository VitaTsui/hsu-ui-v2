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
      columns: [
        expandColumn,
        ...(columns || []).filter((col) => col !== expandColumn),
      ],
      expandable: { ...rowConfig, fixed: "left" },
    };
  }

  const childrenKey = expandable?.childrenColumnName || "children";
  const hasTreeRows = dataSource?.some((row) =>
    Array.isArray(row[childrenKey]),
  );
  if (!hasTreeRows) return { columns, expandable: config };

  // 为最深层级预留缩进空间，展开/收起时固定列宽度保持不变。
  const indentSize = expandable?.indentSize ?? 15;
  const pending = (dataSource || []).map((record) => ({ record, depth: 0 }));
  let maxDepth = 0;
  while (pending.length) {
    const { record, depth } = pending.pop()!;
    maxDepth = Math.max(maxDepth, depth);
    const children = record[childrenKey];
    if (Array.isArray(children)) {
      pending.push(...children.map((record) => ({ record, depth: depth + 1 })));
    }
  }
  const treeColumnWidth = 48 + maxDepth * indentSize;

  return {
    columns: [
      {
        key: "__hsu_expand__",
        width: treeColumnWidth,
        fixed: "left" as const,
        align: "left" as const,
        sorter: false,
        render: () => null,
      },
      ...(columns || []),
    ],
    expandable: {
      ...config,
      columnWidth: treeColumnWidth,
      fixed: "left",
      expandIconColumnIndex: 0,
    },
  };
}
