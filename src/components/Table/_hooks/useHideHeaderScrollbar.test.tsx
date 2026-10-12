import React, { useRef } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import useHideHeaderScrollbar from "./useHideHeaderScrollbar";

function Fixture({ hideScrollbar = true, legacy = false, bordered = false }) {
  const ref = useRef<HTMLDivElement>(null);
  useHideHeaderScrollbar({ ref, hideScrollbar, scroll: true, bordered });
  const fixedClass = legacy ? "ant-table-cell-fix-right" : "ant-table-cell-fix-end";
  const offset = (value: number) => legacy ? { right: value } : { insetInlineEnd: value };

  return (
    <div ref={ref}>
      <div className="ant-table-header">
        <table>
          <colgroup>
            <col style={{ width: 100 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 15 }} />
          </colgroup>
          <thead><tr>
            <th className={fixedClass} style={offset(95)}>First</th>
            <th className={fixedClass} style={offset(15)}>Last</th>
            <th className={`ant-table-cell-scrollbar ${fixedClass}`} style={offset(0)} />
          </tr></thead>
        </table>
      </div>
      <div className="ant-table-body">
        <table><tbody><tr><td className={fixedClass} style={offset(0)}>Body</td></tr></tbody></table>
      </div>
      <div className="ant-table-summary">
        <table>
          <colgroup><col style={{ width: 80 }} /><col style={{ width: 15 }} /></colgroup>
          <tfoot><tr>
            <td className={fixedClass} style={offset(15)} colSpan={2}>Summary</td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  );
}

const headerCells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLTableCellElement>("thead th"));

describe("Table hidden header scrollbar", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return {
          width: this.classList.contains("ant-table-cell-scrollbar") ? 15 : 0,
        } as DOMRect;
      },
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([false, true])("removes the gutter from v6 fixed offsets (bordered=%s)", async (bordered) => {
    const { container } = render(<Fixture bordered={bordered} />);
    await waitFor(() => {
      expect(headerCells(container).map(cell => cell.style.insetInlineEnd)).toEqual(["80px", "0px"]);
    });
    expect(container.querySelector(".ant-table-cell-scrollbar")).toBeNull();
    expect(container.querySelectorAll(".ant-table-header col")).toHaveLength(2);
    expect(container.querySelectorAll(".ant-table-summary col")).toHaveLength(1);
    expect(container.querySelector<HTMLTableCellElement>("tfoot td")!.style.insetInlineEnd).toBe("0px");
    expect(container.querySelector<HTMLTableCellElement>("tbody td")!.style.insetInlineEnd).toBe("0px");
  });

  it("corrects offsets rewritten after a render without subtracting twice", async () => {
    const { container } = render(<Fixture />);
    const [first, last] = headerCells(container);
    await act(async () => {
      first.style.insetInlineEnd = "115px";
      last.style.insetInlineEnd = "15px";
    });
    await waitFor(() => {
      expect(first.style.insetInlineEnd).toBe("100px");
      expect(last.style.insetInlineEnd).toBe("0px");
    });
    await act(async () => {
      first.style.color = "red";
      container.appendChild(document.createElement("span"));
    });
    expect(first.style.insetInlineEnd).toBe("100px");
    expect(last.style.insetInlineEnd).toBe("0px");
  });

  it("supports legacy physical right offsets", () => {
    const { container } = render(<Fixture legacy />);
    expect(headerCells(container).map(cell => cell.style.right)).toEqual(["80px", "0px"]);
  });

  it("preserves data columns when an empty table has no gutter col", () => {
    const { container } = render(<Fixture hideScrollbar={false} />);
    const header = container.querySelector(".ant-table-header")!;
    header.querySelector("col:last-child")!.remove();
    // Attach this empty-data header to a fresh hook instance.
    const markup = header.outerHTML;
    function EmptyTable() {
      const ref = useRef<HTMLDivElement>(null);
      useHideHeaderScrollbar({ ref, hideScrollbar: true, scroll: true });
      return <div ref={ref} dangerouslySetInnerHTML={{ __html: markup }} />;
    }
    const empty = render(<EmptyTable />);
    expect(empty.container.querySelectorAll("col")).toHaveLength(2);
    expect(headerCells(empty.container)[1].style.insetInlineEnd).toBe("0px");
  });

  it("keeps the gutter when the scrollbar is visible", () => {
    const { container } = render(<Fixture hideScrollbar={false} />);
    expect(headerCells(container)[1].style.insetInlineEnd).toBe("15px");
    expect(container.querySelectorAll(".ant-table-cell-scrollbar")).toHaveLength(1);
  });

  it("disconnects the observer on unmount", async () => {
    const { container, unmount } = render(<Fixture />);
    const last = headerCells(container)[1];
    unmount();
    await act(async () => { last.style.insetInlineEnd = "15px"; });
    expect(last.style.insetInlineEnd).toBe("15px");
  });
});
