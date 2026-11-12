import { Equal, get_string_size } from "hsu-utils";
import { useEffect, useState, RefObject, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  DEFAULT_FONT,
  ElementItem,
  Font,
  SearchCardOption,
} from "../_components/OptionRow";

// Optimization: cache measurement results
const measurementCache = new Map<string, number>();

function directMeasureWidth(element: React.ReactElement): Promise<number> {
  // Try to get from the cache
  const cacheKey = JSON.stringify(element.props);
  if (measurementCache.has(cacheKey)) {
    return Promise.resolve(measurementCache.get(cacheKey)!);
  }

  return new Promise((resolve) => {
    // Create a hidden container
    const container = document.createElement("div");

    // Set styles so it is invisible but its size can be computed correctly
    Object.assign(container.style, {
      position: "absolute",
      visibility: "hidden",
      display: "block",
      height: "auto",
      width: "auto",
      top: "-9999px",
      left: "-9999px",
    });

    document.body.appendChild(container);

    // Create a root and render
    const root = createRoot(container);

    try {
      // Render the element directly
      root.render(element);

      // Wait for rendering to finish
      setTimeout(() => {
        try {
          // Get the width of the first child element in the container
          const width = container.clientWidth || 0;

          // Cache the result
          measurementCache.set(cacheKey, width);
          resolve(width);
        } catch {
          resolve(0);
        }

        // Clean up
        try {
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        } catch {
          void 0;
        }
      }, 10);
    } catch {
      resolve(0);

      // Clean up
      try {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      } catch {
        void 0;
      }
    }
  });
}

/**
 * Custom hook that computes which options need to display the "More" button
 */
export function useSearchCardMoreOptions(
  containerRef: RefObject<HTMLDivElement>,
  options: SearchCardOption[],
  font: Font = DEFAULT_FONT,
  padding: number = 8,
  gap: number = 8
) {
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});

  // Optimization: cache the calculation function
  const calculateMoreOptions = useCallback(async () => {
    if (containerRef.current) {
      const div = containerRef.current;
      const width = div.clientWidth;
      const moreWidth = get_string_size("更多", font).width + 15;
      const hasMore: Record<string, boolean> = {};

      for (const option of options) {
        const { width: labelWidth } = get_string_size(
          `${option.label}：`,
          font
        );

        const _options = (
          option.hideAll
            ? option.items
            : [{ label: "全部", value: "" }, ...option.items]
        ) as Array<ElementItem>;

        const optionsWidth: number[] = [];
        for (const item of _options) {
          if (item?.element) {
            const elementWidth = await directMeasureWidth(item.element);
            const labelWidth = get_string_size(item?.label ?? "", font).width;

            optionsWidth.push(elementWidth + labelWidth);
          } else {
            const labelWidth = get_string_size(item?.label ?? "", font).width;
            optionsWidth.push(+(labelWidth + padding * 2).toFixed(2));
          }
        }

        const idx = optionsWidth.reduce((prevIdx, curr, currIdx) => {
          const prev = optionsWidth
            .slice(0, currIdx)
            .reduce((a, b) => a + b, 0);

          if (
            Math.ceil(
              labelWidth + 4 + prev + curr + currIdx * gap + 4 + moreWidth
            ) >= width
          ) {
            if (
              Math.round(labelWidth + 4 + prev + curr + currIdx * gap) <=
                width &&
              currIdx === optionsWidth.length - 1
            ) {
              return currIdx;
            }

            return prevIdx;
          }

          return currIdx;
        }, 0);

        if (idx < optionsWidth.length - 1) {
          hasMore[option.name] = false;
        }
      }

      if (!Equal.ObjEqual(Object.keys(showMore), Object.keys(hasMore))) {
        setShowMore(hasMore);
      }
    }
  }, [containerRef, options, font, padding, gap, showMore]);

  useEffect(() => {
    calculateMoreOptions();

    // Add a window resize listener
    window.addEventListener("resize", calculateMoreOptions);

    return () => {
      window.removeEventListener("resize", calculateMoreOptions);
    };
  }, [calculateMoreOptions]);

  return { showMore, setShowMore };
}

