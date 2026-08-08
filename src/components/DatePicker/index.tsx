import {
  DatePicker as AntdDatePicker,
  DatePickerProps as AntdDatePickerProps,
} from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Select, { SelectOption, SelectProps } from "../Select";
import type { PickerRef } from "../../types/antd";

import classNames from "classnames";
import styles from "./index.module.scss";
import dayjs from "dayjs";
import RangePicker, { RangePickerProps } from "./RangePicker";
import StepPicker, { StepPickerProps } from "./StepPicker";
import { defaultModalPickerGetPopupContainer } from "./defaultModalPickerGetPopupContainer";

type Picker = "date" | "week" | "month" | "quarter" | "year" | "time";

const PickerOptions: SelectOption[] = [
  { label: "日期", value: "date" },
  { label: "周", value: "week" },
  { label: "月份", value: "month" },
  { label: "季度", value: "quarter" },
  { label: "年份", value: "year" },
];

export interface DatePickerProps extends Omit<
  AntdDatePickerProps,
  "picker" | "onChange"
> {
  picker?: Picker;
  showPicker?: boolean;
  pickerHide?: Array<Picker>;
  pickerSelectProps?: SelectProps;
  pickerOptions?: SelectOption[];
  dataPickerCls?: string;
  onChange?: (date?: string, picker?: Picker) => void;
}

interface DatePickerFC extends React.FC<DatePickerProps> {
  RangePicker: React.FC<RangePickerProps>;
  StepPicker: React.FC<StepPickerProps>;
}

const DatePicker: DatePickerFC = (props) => {
  const {
    showPicker = false,
    pickerHide = [],
    pickerSelectProps,
    disabled,
    pickerOptions,
    className,
    dataPickerCls,
    value,
    defaultValue,
    onChange,
    showTime,
    popupClassName,
    getPopupContainer,
    picker: pickerProps,
    ...datePickerProps
  } = props;
  const ref = useRef<PickerRef>(null);
  const [picker, setPicker] = useState<Picker>(pickerProps ?? "date");
  const prevPickerRef = useRef<Picker | undefined>(pickerProps);
  const isInitializedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const defaultValueRef = useRef(defaultValue);
  const showTimeRef = useRef(showTime);

  // Keep refs up to date
  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
    defaultValueRef.current = defaultValue;
    showTimeRef.current = showTime;
  }, [onChange, value, defaultValue, showTime]);

  // Helper function for formatting date values
  const formatDateByPicker = useCallback(
    (dateValue: dayjs.Dayjs, pickerType: Picker): string => {
      if (pickerType === "date") {
        if (showTimeRef.current) {
          return dateValue.format("YYYY-MM-DD HH:mm:ss");
        }
        return dateValue.format("YYYY-MM-DD");
      } else if (pickerType === "week") {
        return dateValue.format("YYYY-wo");
      } else if (pickerType === "month") {
        return dateValue.format("YYYY-MM");
      } else if (pickerType === "quarter") {
        return dateValue.format("YYYY-Q");
      } else if (pickerType === "year") {
        return dateValue.format("YYYY");
      } else if (pickerType === "time") {
        return dateValue.format("HH:mm:ss");
      }
      return "";
    },
    [],
  );

  // Handle onChange when the picker changes
  const handlePickerChange = useCallback(
    (newPicker: Picker) => {
      // When the picker changes, trigger onChange once
      if (onChangeRef.current) {
        // Prefer value; fall back to defaultValue if absent
        const currentValue = valueRef.current ?? defaultValueRef.current;
        if (currentValue) {
          // If there is a current or default value, reformat it with the new picker format
          const dateValue = dayjs(currentValue.toString());
          const formattedDate = formatDateByPicker(dateValue, newPicker);
          onChangeRef.current(formattedDate, newPicker);
        } else {
          // If there is neither a value nor a default value, trigger onChange with an empty string
          onChangeRef.current("", newPicker);
        }
      }
    },
    [formatDateByPicker],
  );

  useEffect(() => {
    if (pickerProps !== undefined) {
      const prevPicker = prevPickerRef.current;

      // Mark as initialized
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      } else {
        // When the picker changes, trigger onChange once (excluding initialization)
        if (prevPicker !== undefined && prevPicker !== pickerProps) {
          handlePickerChange(pickerProps);
        }
      }

      setPicker(pickerProps);
      prevPickerRef.current = pickerProps;
    }
  }, [handlePickerChange, pickerProps]);

  return (
    <div className={classNames(styles.DatePicker, className)}>
      {showPicker && picker !== "time" && (
        <Select
          {...pickerSelectProps}
          className={classNames(
            styles.pickerSelect,
            pickerSelectProps?.className,
          )}
          disabled={pickerSelectProps?.disabled ?? disabled}
          options={(pickerOptions ?? PickerOptions).filter(
            (item) => !pickerHide.includes(item.value as Picker),
          )}
          onChange={(v, o) => {
            pickerSelectProps?.onChange?.(v, o);
            const newPicker = v as Picker;
            handlePickerChange(newPicker);
            setPicker(newPicker);
            prevPickerRef.current = newPicker;
          }}
          value={picker}
          allowClear={false}
          showSearch={false}
        />
      )}
      <AntdDatePicker
        {...datePickerProps}
        ref={ref}
        // v6 replaced `popupClassName` with the `popup.root` semantic slot; this component's own
        // `popupClassName` prop is kept as-is for consumers.
        classNames={{
          popup: { root: classNames(styles.datePickerPopup, popupClassName) },
        }}
        getPopupContainer={getPopupContainer ?? defaultModalPickerGetPopupContainer}
        value={value ? dayjs(value.toString()) : undefined}
        defaultValue={defaultValue ? dayjs(defaultValue.toString()) : undefined}
        picker={picker}
        disabled={disabled}
        className={classNames(dataPickerCls, {
          [styles.antPicker]: !showPicker,
        })}
        style={{ flex: 1, width: 0 }}
        showTime={showTime}
        onChange={(value) => {
          let date = "";

          // v6 widened the picker's onChange value to `Dayjs | Dayjs[]`; a non-range picker only
          // ever hands back a single value.
          const v = Array.isArray(value) ? value[0] : value;

          if (v) {
            if (picker === "date") {
              date = dayjs(v).format("YYYY-MM-DD");

              if (showTime) {
                date = dayjs(v).format("YYYY-MM-DD HH:mm:ss");
              }
            } else if (picker === "week") {
              date = dayjs(v).format("YYYY-wo");
            } else if (picker === "month") {
              date = dayjs(v).format("YYYY-MM");
            } else if (picker === "quarter") {
              date = dayjs(v).format("YYYY-Q");
            } else if (picker === "year") {
              date = dayjs(v).format("YYYY");
            } else if (picker === "time") {
              date = dayjs(v).format("HH:mm:ss");
            }
          }

          onChange?.(date, picker);
        }}
      />
    </div>
  );
};

DatePicker.RangePicker = RangePicker;
DatePicker.StepPicker = StepPicker;

export default DatePicker;
