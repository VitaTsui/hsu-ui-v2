import { FormInstance } from "antd";
import { ReactNode } from "react";
import { FormItemProps } from "../../FormItem";
import { BasicButtonProps } from "../../Button";

/**
 * Base props interface for the Search component
 */
export interface BaseSearchProps {
  searchItems?: FormItemProps[];
  moreSearchItems?: FormItemProps[];
  onSearch?: <T = Record<string, unknown>>(data?: Partial<T>) => void;
  onReset?: () => void;
  className?: string;
  externalForm?: FormInstance;
  hasPermi?: string[];
  /** Search item column count (excluding the button group; total column count is columnNum + 1) */
  columnNum?: number;
  beforeButtonGroup?: BasicButtonProps[];
  affterButtonGroup?: BasicButtonProps[];
  searchData?: Record<string, unknown>;
  minLabelWidth?: boolean | number;
  /** Whether expanded by default */
  defaultExpanded?: boolean;
  /** Callback when the expand state changes */
  onExpandChange?: (expand: boolean) => void;
  /** Whether to enable width-based adaptive layout (by default shows one row including buttons) */
  autoAdaptWidth?: boolean;
  /** Base width for adaptive layout (default 1200px) */
  baseWidth?: number;
  onValuesChange?: (
    value: Record<string, unknown>,
    values: Record<string, unknown>
  ) => void;
  searchDisabled?: boolean;
  showAllSearchItems?: boolean;
  /** Search button text */
  searchText?: ReactNode;
  /** Reset button text */
  resetText?: ReactNode;
  /** Column offset width, used to adjust column width calculation (default 0) */
  columnOffsetWidth?: number;
}

/**
 * Props interface for the Search component with filter
 */
export interface SearchPropsWithFilter extends BaseSearchProps {
  /** Whether to show the filter */
  setFilter?: boolean;
  /** Callback when checked items change in FilterDropdown */
  onFilterChange?: (items: FormItemProps[]) => void;
}
