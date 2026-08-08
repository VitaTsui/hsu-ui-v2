import { Select as AntdSelect, SelectProps as AntdSelectProps } from "antd";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { SelectRef } from "../../types/antd";
import { DefaultOptionType } from "antd/es/select";
import Icon from "../Icon";
import classNames from "classnames";
import styles from "./index.module.scss";
import { generateRandomStr } from "hsu-utils";
import { useSelectComposition, useSelectPopupPosition } from "./_hooks";
import { getElementLeft, calculatePopupWidth, filterOption } from "./_utils";
import { Prefix } from "./_components/Prefix";
import { Suffix } from "./_components/Suffix";
import { isLegacyHasSelectorBrowser } from "../../utils/cssSupports";
import TreeSelect from "./TreeSelect";
import AutoCompleteSelect from "./AutoCompleteSelect";
import IconSelect from "./IconSelect";

export interface SelectOption<T = number | string> {
  label: string;
  value: T;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface SelectProps extends Omit<
  AntdSelectProps,
  "placement" | "filterOption"
> {
  prefix?: ReactNode;
  suffix?: ReactNode;
  selectClassName?: string;
  arrowAnimation?: boolean;
  popupMatchContentWidth?: boolean;
  placement?: "bottomLeft" | "topLeft";
  filterOption?: (searchValue: string, option?: DefaultOptionType) => boolean;
  options?: SelectOption[];
  optionFontSize?: number;
  valueInlabel?: "before" | "after";
}

interface SelectFC extends React.FC<SelectProps> {
  /** 树形选择器 */
  Tree: typeof TreeSelect;
  /** 自动补全选择器 */
  AutoComplete: typeof AutoCompleteSelect;
  /** 图标选择器 */
  Icon: typeof IconSelect;
  /** antd 的 `Select.Option`，供 JSX 写法（本库更推荐用 `options` 属性） */
  Option: typeof AntdSelect.Option;
  /** antd 的 `Select.OptGroup` */
  OptGroup: typeof AntdSelect.OptGroup;
}

const Select = ((props: SelectProps) => {
  const {
    prefix,
    suffix,
    className,
    selectClassName,
    arrowAnimation = true,
    onFocus,
    onBlur,
    onSearch,
    disabled,
    mode,
    popupMatchSelectWidth,
    popupMatchContentWidth,
    popupClassName,
    placement = "bottomLeft",
    filterOption: customFilterOption,
    onChange,
    options = [],
    optionFontSize = 14,
    valueInlabel,
    optionRender,
    labelRender,
    suffixIcon: customSuffixIcon,
    ...antdSelctConfig
  } = props;
  const [focused, setFocused] = useState<boolean>(false);
  const ref = useRef<SelectRef>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [legacyHasErrorStatus, setLegacyHasErrorStatus] =
    useState<boolean>(false);
  const [legacyHasArrowOrClear, setLegacyHasArrowOrClear] =
    useState<boolean>(true);
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  const cls = useMemo(() => generateRandomStr(10), []);

  const { isComposing } = useSelectComposition({ onSearch });

  useSelectPopupPosition(selectRef, open, cls);

  const selectWidth = selectRef.current ? selectRef.current.offsetWidth : 0;

  const calculatedPopupWidth = popupMatchContentWidth
    ? calculatePopupWidth({
        options,
        selectWidth,
        mode,
        optionFontSize,
        valueInlabel,
      })
    : selectWidth;

  useEffect(() => {
    if (!legacyHasSelector) {
      return;
    }

    const container = selectRef.current;
    if (!container) {
      return;
    }

    const selectNode = container.querySelector(
      `.${styles.antdSelect}`,
    ) as HTMLElement | null;
    if (!selectNode) {
      return;
    }

    const updateLegacyStates = () => {
      setLegacyHasErrorStatus(
        selectNode.classList.contains("ant-select-status-error"),
      );

      let hasArrowOrClear = false;
      const children = selectNode.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (
          child.classList.contains("ant-select-arrow") ||
          child.classList.contains("ant-select-clear")
        ) {
          hasArrowOrClear = true;
          break;
        }
      }

      setLegacyHasArrowOrClear(hasArrowOrClear);
    };

    updateLegacyStates();

    if (typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(updateLegacyStates);
    observer.observe(selectNode, {
      attributes: true,
      childList: true,
      subtree: false,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [legacyHasSelector, open]);

  return (
    <div
      className={classNames({
        [styles.select]: true,
        [className ?? ""]: true,
        [styles.focused]: focused,
        [styles.disabled]: disabled,
        [styles.popupMatchContentWidth]: popupMatchContentWidth,
        [styles.legacyHasErrorStatus]:
          legacyHasSelector && legacyHasErrorStatus,
      })}
      onFocus={
        mode
          ? () => {
              ref.current?.focus();
              setOpen(true);
            }
          : undefined
      }
      onBlur={
        mode
          ? () => {
              setOpen(false);
            }
          : undefined
      }
      onClick={
        !mode
          ? () => {
              ref.current?.focus();
              setOpen(!open);
            }
          : undefined
      }
      ref={selectRef}
    >
      {prefix && <Prefix prefix={prefix} />}
      <AntdSelect
        {...{
          allowClear: true,
          showSearch: true,
          ...antdSelctConfig,
          mode,
          open,
          onFocus: (e) => {
            setFocused(true);
            onFocus?.(e);
          },
          onBlur: (e) => {
            setFocused(false);
            setOpen(false);
            onBlur?.(e);
          },
          options,
          labelRender:
            labelRender ??
            ((option) => {
              if (valueInlabel === "before") {
                return option.value;
              }

              return option.label;
            }),
          optionRender:
            optionRender ??
            ((option) => {
              if (valueInlabel) {
                return (
                  <span>
                    <span>
                      {valueInlabel === "before" ? option.value : option.label}
                    </span>
                    <span style={{ opacity: 0.5 }}>
                      {" "}
                      - {valueInlabel === "after" ? option.value : option.label}
                    </span>
                  </span>
                );
              }

              return option.label;
            }),
          onChange,
          filterOption: (searchValue, option) =>
            filterOption({
              searchValue,
              option,
              isComposing,
              customFilterOption,
              valueInlabel,
            }),
          className: classNames(styles.antdSelect, selectClassName, {
            [styles.noArrowAnimation]: !arrowAnimation,
            [styles.legacyHasArrowOrClear]:
              legacyHasSelector && legacyHasArrowOrClear,
          }),
          // v6 replaced `popupClassName` / `dropdownStyle` with the `popup.root` semantic slot.
          // The public `popupClassName` prop of this component is kept as-is for consumers.
          classNames: { popup: { root: `${cls} ${popupClassName ?? ""}` } },
          getPopupContainer: () => selectRef.current ?? document.body,
          popupMatchSelectWidth:
            popupMatchSelectWidth ?? (calculatedPopupWidth || undefined),
          styles: {
            popup: {
              root: {
                left: selectRef.current
                  ? getElementLeft(selectRef.current)
                  : undefined,
                right: "auto",
              },
            },
          },
          suffixIcon: customSuffixIcon ?? <Icon icon="ep:arrow-down" />,
          placement,
        }}
        ref={ref}
        disabled={disabled}
      />
      {suffix && <Suffix suffix={suffix} />}
    </div>
  );
}) as SelectFC;

Select.Tree = TreeSelect;
Select.AutoComplete = AutoCompleteSelect;
Select.Icon = IconSelect;
Select.Option = AntdSelect.Option;
Select.OptGroup = AntdSelect.OptGroup;

export default Select;
