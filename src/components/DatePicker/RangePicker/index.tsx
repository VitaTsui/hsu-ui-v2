import React, { useCallback, useEffect, useRef, useState } from "react";
import { DatePicker } from "antd";
import { RangePickerProps as AntdRangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import styles from "./index.module.scss";
import classNames from "classnames";
import type { RangePickerRef } from "../../../types/antd";
import Select, { SelectOption, SelectProps } from "../../Select";
import { defaultModalPickerGetPopupContainer } from "../defaultModalPickerGetPopupContainer";

type Picker = "date" | "week" | "month" | "quarter" | "year" | "time";

const PickerOptions: SelectOption[] = [
  { label: "日期", value: "date" },
  { label: "周", value: "week" },
  { label: "月份", value: "month" },
  { label: "季度", value: "quarter" },
  { label: "年份", value: "year" },
];

export interface RangePickerProps extends Omit<
  AntdRangePickerProps,
  "onChange" | "value" | "defaultValue"
> {
  value?: string[];
  defaultValue?: string[];
  picker?: Picker;
  showPicker?: boolean;
  pickerHide?: Array<Picker>;
  pickerSelectProps?: SelectProps;
  pickerOptions?: SelectOption[];
  onChange?: (date?: string[], picker?: Picker) => void;
}

const RangePicker: React.FC<RangePickerProps> = (props) => {
  const {
    value,
    defaultValue,
    onChange,
    picker: pickerProps,
    showPicker = false,
    pickerHide = [],
    pickerSelectProps,
    pickerOptions,
    className,
    disabled,
    showTime,
    popupClassName,
    getPopupContainer,
    ...rangePickerConfig
  } = props;
  const ref = useRef<RangePickerRef>(null);
  const [picker, setPicker] = useState<Picker>(pickerProps ?? "date");
  const prevPickerRef = useRef<Picker | undefined>(pickerProps);
  const isInitializedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const defaultValueRef = useRef(defaultValue);
  const showTimeRef = useRef(showTime);
  const selectDisabled =
    pickerSelectProps?.disabled ??
    (typeof disabled === "boolean"
      ? disabled
      : Array.isArray(disabled)
      ? disabled.every(Boolean)
      : false);

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
    defaultValueRef.current = defaultValue;
    showTimeRef.current = showTime;
  }, [onChange, value, defaultValue, showTime]);

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

  const handlePickerChange = useCallback(
    (newPicker: Picker) => {
      if (!onChangeRef.current) {
        return;
      }

      const currentValue = valueRef.current ?? defaultValueRef.current;
      if (currentValue?.length) {
        const date = currentValue.map((item) =>
          formatDateByPicker(dayjs(item.toString()), newPicker),
        );
        onChangeRef.current(date, newPicker);
      } else {
        onChangeRef.current(undefined, newPicker);
      }
    },
    [formatDateByPicker],
  );

  useEffect(() => {
    if (pickerProps !== undefined) {
      const prevPicker = prevPickerRef.current;

      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      } else if (prevPicker !== undefined && prevPicker !== pickerProps) {
        handlePickerChange(pickerProps);
      }

      setPicker(pickerProps);
      prevPickerRef.current = pickerProps;
    }
  }, [handlePickerChange, pickerProps]);

  return (
    <div className={classNames(styles.RangePickerWrap, className)}>
      {showPicker && picker !== "time" && (
        <Select
          {...pickerSelectProps}
          className={classNames(
            styles.pickerSelect,
            pickerSelectProps?.className,
          )}
          disabled={selectDisabled}
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
      <DatePicker.RangePicker
        {...rangePickerConfig}
        ref={ref}
        classNames={{
          popup: { root: classNames(styles.rangePickerPopup, popupClassName) },
        }}
        getPopupContainer={getPopupContainer ?? defaultModalPickerGetPopupContainer}
        className={styles.RangePicker}
        picker={picker}
        disabled={disabled}
        showTime={showTime}
        defaultValue={
          Array.isArray(defaultValue)
            ? (defaultValue?.map((i) => dayjs(new Date(i!.toString()))) as [
                dayjs.Dayjs,
                dayjs.Dayjs,
              ])
            : defaultValue
        }
        value={
          Array.isArray(value)
            ? (value?.map((i) => dayjs(new Date(i!.toString()))) as [
                dayjs.Dayjs,
                dayjs.Dayjs,
              ])
            : value
        }
        onChange={(dates) => {
          if (!dates) {
            onChange?.(undefined, picker);
          } else {
            let date: string[] = [];

            if (picker === "date") {
              date = dates?.map((i) => {
                return showTime
                  ? dayjs(i).format("YYYY-MM-DD HH:mm:ss")
                  : dayjs(i).format("YYYY-MM-DD");
              });
            } else if (picker === "week") {
              date = dates?.map((i) => dayjs(i).format("YYYY-wo"));
            } else if (picker === "month") {
              date = dates?.map((i) => dayjs(i).format("YYYY-MM"));
            } else if (picker === "quarter") {
              date = dates?.map((i) => dayjs(i).format("YYYY-Q"));
            } else if (picker === "year") {
              date = dates?.map((i) => dayjs(i).format("YYYY"));
            } else if (picker === "time") {
              date = dates?.map((i) => dayjs(i).format("HH:mm:ss"));
            }

            onChange?.(date, picker);
          }
        }}
      />
    </div>
  );
};

export default RangePicker;
