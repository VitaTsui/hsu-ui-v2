import { useCallback } from "react";
import { ColumnsType, EllipsisTooltipConfig } from "..";
import { AnyObject } from "antd/es/_util/type";
import TextEllipsis from "../../TextEllipsis";
import React from "react";

/**
 * Automatically adds overflow detection and a Tooltip for columns that set ellipsis and have no custom render
 */
const useEllipsisTooltip = <T extends AnyObject>(
  tooltipConfig?: EllipsisTooltipConfig,
) => {
  const enhanceColumns = useCallback(
    (columns?: ColumnsType<T>): ColumnsType<T> | undefined => {
      return columns?.map((column) => {
        // Recursively process child columns
        if (column.children) {
          return {
            ...column,
            children: enhanceColumns(column.children),
          };
        }

        // If ellipsis is set and there is no custom render
        if (column.ellipsis && !column.render && column.dataIndex) {
          // 宽列（声明宽度 > 300）让 Tooltip 至少铺到列宽：这类列本来就是放长文本的，
          // Tooltip 仍按 200 起步会把一行摊成十几行。
          //
          // 窄列（≤ 300）依旧不传，回落到 TextEllipsis 实测的单元格宽度 —— 声明宽度经
          // fixedWidth 比例分配后与实际渲染宽度并不相等，拿它当 Tooltip 宽度会偏。
          //
          // Number() 只对数值宽度有意义："20%" / "auto" 这类会得到 NaN，而
          // Math.max(NaN, 300) 仍是 NaN、且 NaN === 300 为 false，不拦住就会把 NaN
          // 当宽度传下去。非数值一律按窄列处理，交给实测。
          const declaredWidth = Number(column.width ?? 0);
          const tooltipWidth = Number.isFinite(declaredWidth)
            ? Math.max(declaredWidth, 300)
            : 300;

          return {
            ...column,
            render: (text) => {
              // Get the actual display value
              const displayValue =
                typeof text === "string" || typeof text === "number"
                  ? text
                  : String(text ?? "");

              return React.createElement(TextEllipsis, {
                tooltipConfig: tooltipConfig,
                children: displayValue,
                // 见上：只有宽列才给显式宽度，undefined 表示交给 TextEllipsis 实测
                width: tooltipWidth === 300 ? undefined : tooltipWidth,
                ellipsisPosition:
                  column.ellipsisPosition ?? tooltipConfig?.ellipsisPosition,
                key: text,
              });
            },
          };
        }

        return column;
      });
    },
    [tooltipConfig],
  );

  return { enhanceColumns };
};

export default useEllipsisTooltip;
