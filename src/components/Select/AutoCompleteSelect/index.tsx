import { AutoComplete, AutoCompleteProps } from "antd";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import styles from "./index.module.scss";
import { generateRandomStr } from "hsu-utils";
import { Prefix } from "../_components/Prefix";
import { Suffix } from "../_components/Suffix";
import { useSelectComposition, useSelectPopupPosition } from "../_hooks";
import { getElementLeft, calculatePopupWidth } from "../_utils";
import Icon from "../../Icon";
import { isLegacyHasSelectorBrowser } from "../../../utils/cssSupports";

export interface AutoCompleteOption {
  label?: string;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface AutoCompleteSelectProps
  extends Omit<
    AutoCompleteProps,
    "options" | "filterOption" | "dropdownStyle" | "placement" | "children"
  > {
  prefix?: ReactNode;
  suffix?: ReactNode;
  selectClassName?: string;
  options?: AutoCompleteOption[];
  filterOption?: (inputValue: string, option?: AutoCompleteOption) => boolean;
  placement?: "bottomLeft" | "topLeft";
  popupMatchSelectWidth?: boolean | number;
  popupMatchContentWidth?: boolean;
  optionFontSize?: number;
}

const AutoCompleteSelect: React.FC<AutoCompleteSelectProps> = (props) => {
  const {
    prefix,
    suffix,
    className,
    selectClassName,
    onFocus,
    onBlur,
    onSearch,
    disabled,
    popupClassName,
    filterOption: customFilterOption,
    onChange,
    options = [],
    placement = "bottomLeft",
    onDropdownVisibleChange,
    popupMatchSelectWidth,
    popupMatchContentWidth,
    optionFontSize = 14,
    value,
    ...antdAutoCompleteConfig
  } = props;
  const [focused, setFocused] = useState<boolean>(false);
  const autoCompleteRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [legacyHasErrorStatus, setLegacyHasErrorStatus] =
    useState<boolean>(false);
  const [legacyHasArrowOrClear, setLegacyHasArrowOrClear] =
    useState<boolean>(true);
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  const cls = useMemo(() => generateRandomStr(10), []);

  const handleSearch = useCallback(
    (searchValue: string) => {
      setSearchText(searchValue);
      onSearch?.(searchValue);
    },
    [onSearch],
  );

  // Always pass handleSearch so IME composition events stay observed
  // (an in-progress pinyin input must not wipe out the option list)
  const { isComposing } = useSelectComposition({ onSearch: handleSearch });

  const autoCompleteWidth = autoCompleteRef.current
    ? autoCompleteRef.current.offsetWidth
    : 0;

  const calculatedPopupWidth = popupMatchContentWidth
    ? calculatePopupWidth({
        options: options?.map((opt) => ({
          label: opt.label ?? opt.value,
          value: opt.value,
        })),
        selectWidth: autoCompleteWidth,
        optionFontSize,
      })
    : autoCompleteWidth;

  // Convert options into the format AutoComplete requires
  const autoCompleteOptions = useMemo(() => {
    return options?.map((option) => {
      const { label, value, disabled, ...rest } = option;
      return {
        value,
        label: label ?? value,
        disabled,
        ...rest,
      };
    });
  }, [options]);

  // Filter rule: prefer the custom filterOption, otherwise fall back to a
  // case-insensitive substring match
  const matchOption = useMemo(() => {
    if (customFilterOption) {
      return customFilterOption;
    }

    return (inputValue: string, option?: AutoCompleteOption): boolean => {
      if (!option) {
        return true;
      }
      const keyword = inputValue.toUpperCase();
      const optionValue = (option.value ?? "").toString().toUpperCase();
      const optionLabel = (option.label ?? option.value ?? "")
        .toString()
        .toUpperCase();
      return optionValue.includes(keyword) || optionLabel.includes(keyword);
    };
  }, [customFilterOption]);

  // Text the filter runs against: the controlled value wins, otherwise use the
  // internally tracked search keyword
  const filterText = useMemo(() => {
    if (value !== undefined && value !== null) {
      return String(value);
    }
    return searchText;
  }, [value, searchText]);

  // Filter inside the component (antd's own filterOption is turned off) so we
  // know whether any candidate survives, keeping controlled open in sync
  const filteredOptions = useMemo(() => {
    // Skip filtering while composing so an in-progress pinyin input does not
    // empty the candidate list
    if (isComposing || !filterText) {
      return autoCompleteOptions;
    }
    return autoCompleteOptions.filter((option) =>
      matchOption(filterText, option),
    );
  }, [autoCompleteOptions, filterText, isComposing, matchOption]);

  // In combobox mode antd hides the popup by itself when there is no candidate
  // and skips onDropdownVisibleChange, so fold "no candidate" into open to stop
  // the controlled state from drifting and leaving an empty popup behind
  const mergedOpen = open && filteredOptions.length > 0;

  useSelectPopupPosition(autoCompleteRef, mergedOpen, cls);

  useEffect(() => {
    if (!legacyHasSelector) {
      return;
    }

    const container = autoCompleteRef.current;
    if (!container) {
      return;
    }

    const selectNode = container.querySelector(
      `.${styles.antdAutoComplete}`,
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
  }, [legacyHasSelector, mergedOpen]);

  return (
    <div
      className={classNames({
        [styles.autoCompleteSelect]: true,
        [className ?? ""]: true,
        [styles.focused]: focused,
        [styles.disabled]: disabled,
        [styles.popupMatchContentWidth]: popupMatchContentWidth,
        [styles.legacyHasErrorStatus]:
          legacyHasSelector && legacyHasErrorStatus,
      })}
      ref={autoCompleteRef}
    >
      {prefix && <Prefix prefix={prefix} />}
      <AutoComplete
        {...{
          allowClear: true,
          ...antdAutoCompleteConfig,
          value,
          onFocus: (e) => {
            setFocused(true);
            onFocus?.(e);
          },
          onBlur: (e) => {
            setFocused(false);
            // antd skips onDropdownVisibleChange when there is no candidate,
            // so collapse the controlled state manually on blur
            setOpen(false);
            onBlur?.(e);
          },
          options: filteredOptions,
          filterOption: false,
          onChange,
          onSearch: handleSearch,
          open: mergedOpen,
          onDropdownVisibleChange: (visible) => {
            setOpen(visible);
            onDropdownVisibleChange?.(visible);
          },
          className: classNames(styles.antdAutoComplete, selectClassName, {
            [styles.legacyHasArrowOrClear]:
              legacyHasSelector && legacyHasArrowOrClear,
          }),
          popupClassName: `${cls} ${popupClassName ?? ""}`,
          getPopupContainer: () => autoCompleteRef.current ?? document.body,
          popupMatchSelectWidth:
            popupMatchSelectWidth ?? (calculatedPopupWidth || undefined),
          dropdownStyle: {
            left: autoCompleteRef.current
              ? getElementLeft(autoCompleteRef.current)
              : undefined,
            right: "auto",
          },
          placement,
          disabled,
          suffixIcon: <Icon icon="ep:arrow-down" />,
          onClear: () => {
            setOpen(false);
          },
        }}
      />
      {suffix && <Suffix suffix={suffix} />}
    </div>
  );
};

export default AutoCompleteSelect;
