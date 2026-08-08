/**
 * Gets the number of consecutive rows with the same value
 * @param record Current row data
 * @param index Current row index
 * @param dataSource Data source
 * @param key Key of the shared value
 * @returns Number of consecutive rows with the same value
 */
export function getDepartmentRowSpan<T extends Record<string, unknown>>(
  record: T,
  index: number,
  dataSource: T[],
  key: string
) {
  const current = record[key];

  // If this is not the first row with the value, return 0 (not displayed)
  if (index > 0 && dataSource[index - 1][key] === current) {
    return 0;
  }

  // Count consecutive rows with the same value
  let count = 1;
  for (let i = index + 1; i < dataSource.length; i++) {
    if (dataSource[i][key] === current) {
      count++;
    } else {
      break;
    }
  }

  return count;
}

/**
 * Tooltip config constants
 */
export const HELP_TOOLTIP_CONFIG = {
  arrow: false,
  placement: "top" as const,
  color: "var(--cf-subtle)",
  // antd v6 renamed Tooltip's `body` slot to `container`
  styles: { container: { color: "var(--cf-text)", padding: "6px 16px" } },
};
