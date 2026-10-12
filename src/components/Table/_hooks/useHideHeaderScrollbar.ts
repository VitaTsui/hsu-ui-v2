import { useEffect } from "react";

interface Params {
  scroll?: boolean | { y: boolean };
  hideScrollbar?: boolean;
  cls?: string;
  ref?: React.RefObject<HTMLDivElement>;
  bordered?: boolean;
}

const useHideHeaderScrollbar = (params: Params) => {
  const { hideScrollbar, ref, scroll } = params;
  const scrollEnabled = Boolean(scroll);

  useEffect(() => {
    const root = ref?.current;
    if (!hideScrollbar || !scrollEnabled || !root) return;

    // antd v6 uses fix-end / inset-inline-end. Keep the legacy right styles
    // supported too. Remember the gutter after removing its placeholder, since
    // React can write the original sticky offset again on a later render.
    const gutters = new WeakMap<HTMLTableElement, number>();
    const adjustedOffsets = new WeakMap<HTMLElement, string>();

    const update = () => {
      const tables = root.querySelectorAll<HTMLTableElement>(
        ".ant-table-header table, .ant-table-summary table",
      );
      let headerGutter: number | undefined;

      tables.forEach((table) => {
        const headerBar = table.querySelector<HTMLElement>(
          ".ant-table-cell-scrollbar",
        );
        if (headerBar) {
          const colBar = table.querySelector<HTMLTableColElement>(
            "colgroup col:last-child",
          );
          // Measure the whole cell, including borders. With an empty data source
          // antd can use a colgroup without a gutter col, so don't remove its last
          // data column merely because a scrollbar cell exists.
          const colWidth = Number.parseFloat(colBar?.style.width || "");
          const gutter = headerBar.getBoundingClientRect().width;
          if (!gutter) return;
          gutters.set(table, gutter);
          if (Math.abs(colWidth - gutter) < 0.5) colBar?.remove();
          headerBar.remove();
        }

        if (table.closest(".ant-table-header")) {
          headerGutter = gutters.get(table);
        } else if (headerGutter !== undefined && !gutters.has(table)) {
          // A separate fixed summary holder has a gutter col, but no scrollbar
          // cell: its final summary cell spans across the gutter instead.
          const colBar = table.querySelector<HTMLTableColElement>(
            "colgroup col:last-child",
          );
          if (Number.parseFloat(colBar?.style.width || "") === headerGutter) {
            gutters.set(table, headerGutter);
            colBar?.remove();
          }
        }

        const gutter = gutters.get(table);
        if (gutter === undefined) return;

        table
          .querySelectorAll<HTMLElement>(
            ".ant-table-cell-fix-end, .ant-table-cell-fix-right",
          )
          .forEach((cell) => {
            const property = cell.style.insetInlineEnd
              ? "insetInlineEnd"
              : "right";
            const current = cell.style[property];
            if (current === adjustedOffsets.get(cell)) return;

            const offset = Number.parseFloat(current);
            if (!Number.isFinite(offset)) return;

            const adjusted = `${Math.max(0, offset - gutter)}px`;
            adjustedOffsets.set(cell, adjusted);
            if (current !== adjusted) cell.style[property] = adjusted;
          });
      });
    };

    const observer = new MutationObserver(update);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    update();

    return () => observer.disconnect();
  }, [hideScrollbar, ref, scrollEnabled]);
};

export default useHideHeaderScrollbar;
