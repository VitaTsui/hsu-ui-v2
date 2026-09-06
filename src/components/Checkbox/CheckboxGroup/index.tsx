import { Checkbox } from "antd";
import {
  CheckboxGroupProps as AntdCheckboxGroupProps,
  CheckboxOptionType,
} from "antd/es/checkbox";
import React, { useMemo, useCallback } from "react";
import classNames from "classnames";
import styles from "./index.module.scss";

const Group = Checkbox.Group;

// 解构默认值写成字面量会每次渲染新建一个数组，进依赖数组就让 memo 恒不命中；提到模块级常量
const EMPTY_OPTIONS: AntdCheckboxGroupProps["options"] = [];

export interface CheckboxGroupProps extends AntdCheckboxGroupProps {
  outline?: boolean;
  hasAll?: boolean;
  layout?: "vertical" | "horizontal";
  allMaxHeight?: number;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = (props) => {
  const {
    className,
    outline,
    hasAll,
    options = EMPTY_OPTIONS,
    value,
    onChange,
    layout = "horizontal",
    allMaxHeight,
    ...rest
  } = props;

  // Get the values of all non-"All" options
  const normalValues = useMemo(() => {
    return options?.map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return option;
      }
      return (option as CheckboxOptionType).value;
    });
  }, [options]);

  // Compute the state of the "All" option
  const allChecked = useMemo(() => {
    if (!hasAll || !value || normalValues.length === 0) return false;
    const selectedValues = Array.isArray(value) ? value : [];
    return (
      normalValues.length > 0 &&
      normalValues.every((val) => selectedValues.includes(val))
    );
  }, [hasAll, value, normalValues]);

  const allIndeterminate = useMemo(() => {
    if (!hasAll || !value || normalValues.length === 0) return false;
    const selectedValues = Array.isArray(value) ? value : [];
    const selectedCount = normalValues.filter((val) =>
      selectedValues.includes(val)
    ).length;
    return selectedCount > 0 && selectedCount < normalValues.length;
  }, [hasAll, value, normalValues]);

  // Handle clicks on the "All" option
  const handleAllChange = useCallback(
    (e: { target: { checked: boolean } }) => {
      if (!onChange) return;

      if (e.target.checked) {
        // Select all options
        onChange(normalValues);
      } else {
        // Deselect all options
        onChange([]);
      }
    },
    [onChange, normalValues]
  );

  // Handle clicks on normal options
  const handleChange = useCallback(
    (checkedValues: (string | number)[]) => {
      if (!onChange) return;
      onChange(checkedValues);
    },
    [onChange]
  );

  if (hasAll) {
    return (
      <div
        className={classNames(styles.checkboxGroup, className, {
          [styles.outline]: outline,
          [styles.hasAll]: hasAll,
        })}
        style={{ maxHeight: allMaxHeight ? `${allMaxHeight}px` : undefined }}
      >
        {!!options.length && (
          <Checkbox
            checked={allChecked}
            indeterminate={allIndeterminate}
            onChange={handleAllChange}
            className={styles.allCheckbox}
          >
            全选
          </Checkbox>
        )}
        <Group
          options={options}
          value={value}
          onChange={handleChange}
          {...rest}
        />
      </div>
    );
  }

  return (
    <Group
      className={classNames(styles.checkboxGroup, className, {
        [styles.outline]: outline,
        [styles[layout]]: layout,
      })}
      options={options}
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
};

export default CheckboxGroup;
