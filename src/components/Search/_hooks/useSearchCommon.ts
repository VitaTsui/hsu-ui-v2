import { FormInstance } from "antd";
import { useMemo, useRef, useCallback, RefObject } from "react";
import { FormItemProps } from "../../FormItem";
import { generateRandomStr } from "hsu-utils";
import useLabelWidth from "../../../hooks/useLabelWidth";
import usePermissions from "../../../hooks/usePermissions";
import { useSearchItems } from "./useSearchItems";
import { useSearchForm } from "./useSearchForm";
import { useAdaptiveColumnNum } from "./useAdaptiveColumnNum";
import { useSearchExpand } from "./useSearchExpand";
import {
  cleanSearchData,
  calculateVisibleItems,
  calculateButtonGroupAndColumnWidth,
  shouldDisplayExtraItem,
} from "../_utils";
import styles from "../index.module.scss";
import { BasicButtonProps } from "../../Button";

export interface UseSearchCommonParams {
  form: FormInstance;
  searchItems: FormItemProps[];
  moreSearchItems?: FormItemProps[];
  searchData?: Record<string, unknown>;
  hasPermi?: string[];
  beforeButtonGroup?: BasicButtonProps[];
  affterButtonGroup?: BasicButtonProps[];
  columnNum: number;
  autoAdaptWidth: boolean;
  defaultExpanded: boolean;
  onExpandChange?: (expand: boolean) => void;
  showAllSearchItems: boolean;
  minLabelWidth?: boolean | number;
  baseWidth?: number;
  onSearch?: <T = Record<string, unknown>>(data?: Partial<T>) => void;
  onReset?: () => void;
  columnOffsetWidth?: number;
}

export interface UseSearchCommonReturn {
  // Refs
  containerRef: RefObject<HTMLDivElement>;
  buttonGroupRef: RefObject<HTMLDivElement>;
  cls: string;

  // Form
  getLabelWidth: ReturnType<typeof useLabelWidth>[1];

  // Search Items
  processedSearchItems: FormItemProps[];
  setSearchItems: (items: FormItemProps[]) => void;
  visibleSearchItems: FormItemProps[];
  visibleMoreSearchItems: FormItemProps[];
  visibleSearchItemCount: number;
  currentSearchItems: FormItemProps[];

  // Column & Layout
  totalColumnNum: number;
  adaptiveColumnNum: number;

  // Expand Control
  expand: boolean;
  setExpand?: (expand: boolean) => void;
  toggleExpand: () => void;
  visibleItemCount: number;
  hasCustomWidth: boolean;
  showExpandButton: boolean;

  // Callbacks
  onSearchClick: () => void;
  onResetClick: () => void;

  // Render Check
  shouldRender: boolean;
  // Permission
  permitted: boolean;
}

/**
 * Extracts the common logic shared by all Search components
 */
export const useSearchCommon = (
  params: UseSearchCommonParams,
): UseSearchCommonReturn => {
  const {
    form,
    searchItems,
    moreSearchItems = [],
    searchData,
    hasPermi,
    beforeButtonGroup,
    affterButtonGroup,
    columnNum,
    autoAdaptWidth,
    defaultExpanded,
    onExpandChange,
    showAllSearchItems,
    baseWidth,
    onSearch,
    onReset,
    columnOffsetWidth = 0,
  } = params;

  const [, getLabelWidth] = useLabelWidth();
  const { permitted, checkPermission } = usePermissions(hasPermi);
  const { searchItems: processedSearchItems, setSearchItems } =
    useSearchItems(searchItems);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonGroupRef = useRef<HTMLDivElement>(null);
  const cls = useMemo(() => generateRandomStr(10), []);

  // Extract visible search items
  const visibleSearchItems = useMemo(() => {
    return processedSearchItems.filter((item) => item.visible !== false);
  }, [processedSearchItems]);

  // Extract visible "more" search items
  const visibleMoreSearchItems = useMemo(() => {
    return moreSearchItems.filter((item) => item.visible !== false);
  }, [moreSearchItems]);

  // Count of visible search items
  const visibleSearchItemCount = visibleSearchItems.length;

  // Total column count (including the button group)
  const baseTotalColumnNum = columnNum + 1;

  // Dynamically adjust column count based on container width
  const totalColumnNum = useAdaptiveColumnNum(
    containerRef,
    baseTotalColumnNum,
    autoAdaptWidth,
    1, // minColumnNum
    undefined, // maxColumnNum
    undefined, // breakpoints
    baseWidth,
  );

  // Adjusted search-item column count (excluding the button group)
  const adaptiveColumnNum = Math.max(1, totalColumnNum - 1);

  // Use width-based expand/collapse control
  const { expand, setExpand, toggleExpand, visibleItemCount } = useSearchExpand(
    containerRef,
    buttonGroupRef,
    `.${cls} .${styles.item}`,
    visibleSearchItemCount,
    adaptiveColumnNum,
    autoAdaptWidth,
    defaultExpanded,
    onExpandChange,
    processedSearchItems,
    showAllSearchItems || !!moreSearchItems?.length,
    columnOffsetWidth,
  );

  useSearchForm({ form, searchData });

  // Compute the search items that should currently be displayed
  const currentSearchItems = useMemo(() => {
    if (showAllSearchItems || !!moreSearchItems?.length) {
      if (expand) return [...visibleSearchItems, ...visibleMoreSearchItems];
      return visibleSearchItems;
    }

    // Compute button group width and column width (used to decide whether more items should be displayed)
    let buttonGroupWidth: number | undefined;
    let columnWidth: number | undefined;

    if (!expand) {
      const result = calculateButtonGroupAndColumnWidth(
        containerRef,
        buttonGroupRef,
        adaptiveColumnNum,
        columnOffsetWidth,
      );
      buttonGroupWidth = result.buttonGroupWidth;
      columnWidth = result.columnWidth;
    }

    // Otherwise use the calculation function
    return calculateVisibleItems(
      processedSearchItems,
      expand,
      adaptiveColumnNum,
      visibleItemCount,
      autoAdaptWidth,
      buttonGroupWidth,
      columnWidth,
    );
  }, [
    showAllSearchItems,
    moreSearchItems?.length,
    expand,
    processedSearchItems,
    adaptiveColumnNum,
    visibleItemCount,
    autoAdaptWidth,
    visibleSearchItems,
    visibleMoreSearchItems,
    columnOffsetWidth,
  ]);

  const onResetClick = useCallback(() => {
    if (!form) return;
    form.resetFields();
    onReset?.();
  }, [form, onReset]);

  const onSearchClick = useCallback(() => {
    if (!form) return;
    form.validateFields().then((value) => {
      const cleanedData = cleanSearchData(value);
      onSearch?.(cleanedData);
    });
  }, [form, onSearch]);

  // Check whether any item has a custom width
  const hasCustomWidth = useMemo(() => {
    return processedSearchItems.some((item) => item.width !== undefined);
  }, [processedSearchItems]);

  // Compute the actual number of items to display (accounting for the case where the button group is wider than a column)
  const actualDisplayCount = useMemo(() => {
    if (hasCustomWidth) {
      return visibleItemCount;
    }

    // Compute button group width and column width
    const { buttonGroupWidth, columnWidth } =
      calculateButtonGroupAndColumnWidth(
        containerRef,
        buttonGroupRef,
        adaptiveColumnNum,
        columnOffsetWidth,
      );

    // If the button group is wider than a column, display actual search item count + 1
    if (
      shouldDisplayExtraItem(
        buttonGroupWidth,
        columnWidth,
        adaptiveColumnNum,
        visibleSearchItemCount,
      )
    ) {
      return adaptiveColumnNum + 1;
    }

    return adaptiveColumnNum;
  }, [
    hasCustomWidth,
    adaptiveColumnNum,
    columnOffsetWidth,
    visibleSearchItemCount,
    visibleItemCount,
  ]);

  // Determine whether to show the expand button
  const showExpandButton = useMemo(() => {
    // If there are "more" search items, show the expand button
    if (showAllSearchItems || !!moreSearchItems?.length) {
      if (visibleMoreSearchItems?.length) {
        return true;
      }
      return false;
    }

    // If there are custom widths, decide based on the visible item count
    if (hasCustomWidth) {
      return visibleSearchItemCount > visibleItemCount;
    }
    // Otherwise decide based on the actual display count (accounting for the case where the button group is wider than a column)
    return visibleSearchItemCount > actualDisplayCount;
  }, [
    showAllSearchItems,
    moreSearchItems,
    hasCustomWidth,
    visibleSearchItemCount,
    actualDisplayCount,
    visibleMoreSearchItems?.length,
    visibleItemCount,
  ]);

  // Check whether the button group contains any permitted button
  const hasPermittedButtons = useCallback(
    (buttonGroup?: BasicButtonProps[]) => {
      if (!buttonGroup?.length) return false;

      return buttonGroup.some((button) => checkPermission(button.hasPermi));
    },
    [checkPermission],
  );

  // Permission and content check
  const shouldRender = useMemo(() => {
    return Boolean(
      hasPermittedButtons(beforeButtonGroup) ||
      hasPermittedButtons(affterButtonGroup) ||
      (permitted && searchItems.length > 0),
    );
  }, [
    searchItems.length,
    beforeButtonGroup,
    affterButtonGroup,
    permitted,
    hasPermittedButtons,
  ]);

  return {
    containerRef,
    buttonGroupRef,
    cls,
    getLabelWidth,
    processedSearchItems,
    setSearchItems,
    visibleSearchItems,
    visibleMoreSearchItems,
    visibleSearchItemCount,
    currentSearchItems,
    totalColumnNum,
    adaptiveColumnNum,
    expand,
    setExpand,
    toggleExpand,
    visibleItemCount,
    hasCustomWidth,
    showExpandButton,
    onSearchClick,
    onResetClick,
    shouldRender,
    permitted,
  };
};
