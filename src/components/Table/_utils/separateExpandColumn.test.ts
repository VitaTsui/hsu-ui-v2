import { describe, expect, it } from "vitest";
import { separateExpandColumn } from "./separateExpandColumn";

const serial = { dataIndex: "serialNumber", width: 60, fixed: "left" as const };
const name = { dataIndex: "name", width: 100 };
const expandColumn = {};

describe("Table separate expand column", () => {
  it("gives tree expand buttons their own fixed column before the serial column", () => {
    const result = separateExpandColumn([serial, name], {}, [{ key: 1, children: [{ key: 2 }] }], expandColumn);
    expect(result.columns).toHaveLength(3);
    expect(result.columns![0]).toMatchObject({ key: "__hsu_expand__", width: 48, fixed: "left" });
    expect(result.columns![1]).toBe(serial);
    expect(result.expandable.expandIconColumnIndex).toBe(0);
  });

  it("handles a custom children field and overrides a combined icon position", () => {
    const result = separateExpandColumn([serial, name], { childrenColumnName: "nodes", expandIconColumnIndex: 1 }, [{ nodes: [] }], expandColumn);
    expect(result.columns![1]).toBe(serial);
    expect(result.expandable.expandIconColumnIndex).toBe(0);
  });

  it("uses the native dedicated expand column for expanded content", () => {
    const result = separateExpandColumn([serial, name], { expandedRowRender: () => null, fixed: "right", expandIconColumnIndex: 1 }, [{ key: 1 }], expandColumn);
    expect(result.columns).toEqual([expandColumn, serial, name]);
    expect(result.expandable).toMatchObject({ columnWidth: 48, fixed: "left" });
    expect(result.expandable).not.toHaveProperty("expandIconColumnIndex");
  });

  it("does not duplicate an explicit expand placeholder", () => {
    const result = separateExpandColumn([serial, expandColumn, name], { expandedRowRender: () => null }, [], expandColumn);
    expect(result.columns).toEqual([expandColumn, serial, name]);
  });

  it("adds no expand column for flat rows", () => {
    const columns = [serial, name];
    const result = separateExpandColumn(columns, {}, [{ key: 1 }], expandColumn);
    expect(result.columns).toBe(columns);
  });

  it("respects explicitly disabled expansion controls", () => {
    const columns = [serial, name];
    const result = separateExpandColumn(columns, { showExpandColumn: false }, [{ children: [] }], expandColumn);
    expect(result.columns).toBe(columns);
  });
});
