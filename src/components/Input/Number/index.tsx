import {
  InputNumber as AntdInputNumber,
  InputNumberProps as AntdInputNumberProps,
  Space,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { CloseCircleFilled } from "@ant-design/icons";

import classNames from "classnames";
import styles from "./index.module.scss";
import { useDebounceEffect } from "ahooks";
import type { InputNumberRef } from "../../../types/antd";

export interface InputNumberProps extends Omit<
  AntdInputNumberProps,
  "ref" | "onChange" | "value"
> {
  getRef?: (ref: HTMLInputElement | null) => void;
  onChange?: (value: string) => void;
  value?: string;
  allowClear?: boolean;
  wrapperClassName?: string;
}

const InputNumber: React.FC<InputNumberProps> = (props) => {
  const {
    onChange,
    getRef,
    value,
    defaultValue,
    className,
    disabled,
    allowClear = true,
    addonAfter,
    suffix,
    wrapperClassName,
    ...inputConfig
  } = props;
  // antd v6 types InputNumber's ref as `InputNumberRef`, which extends `HTMLInputElement` — so
  // `getRef` keeps handing consumers an `HTMLInputElement` exactly as before.
  const ref = useRef<InputNumberRef>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // On initialization, prefer value, then fall back to defaultValue
  const initialValue =
    value !== undefined
      ? typeof value === "number"
        ? `${value}`
        : (value?.toString() ?? "")
      : defaultValue !== undefined
        ? typeof defaultValue === "number"
          ? `${defaultValue}`
          : (defaultValue?.toString() ?? "")
        : "";

  const [_value, setValue] = useState<string>(initialValue);
  const [lastValue, setLastValue] = useState<string>(initialValue);
  const prevValueRef = useRef<typeof value>(undefined);

  useDebounceEffect(
    () => {
      if (_value !== lastValue) {
        setLastValue(_value);

        onChange?.(_value);
      }
    },
    [_value, lastValue, onChange],
    {
      wait: 10,
    },
  );

  useEffect(() => {
    // Update internal state only when the external value prop actually changes
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;

      if (value !== undefined) {
        const newValue =
          typeof value === "number" ? `${value}` : value?.toString();
        setValue(newValue);
        setLastValue(newValue);
      } else {
        // Clear only on initialization or when explicitly set to undefined externally
        setValue("");
        setLastValue("");
      }
    }
  }, [value]);

  useEffect(() => {
    getRef?.(ref.current);
  }, [getRef]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("");
    setLastValue("");
    onChange?.("");
  };

  const showClear =
    allowClear && _value !== "" && _value !== undefined && !disabled;

  const input = (
    <AntdInputNumber
      ref={ref}
      value={_value}
      onChange={(e) => {
        const newValue =
          e === null || e === undefined
            ? ""
            : (typeof e === "number" ? e : e || "").toString();
        setValue(newValue);
      }}
      className={classNames(styles.antdInput, className)}
      controls={false}
      disabled={disabled}
      // The clear button used to be absolutely positioned over the wrapper, which meant its offset
      // had to be recomputed from the addon's measured width (a rAF + ResizeObserver dance writing
      // `--addon-after-width`). Riding antd's own `suffix` slot instead puts it inside the input,
      // so it can never collide with the addon and nothing needs measuring.
      suffix={
        <>
          {showClear && (
            <CloseCircleFilled
              className={styles.clearIcon}
              onClick={handleClear}
            />
          )}
          {suffix}
        </>
      }
      {...inputConfig}
      stringMode
    />
  );

  return (
    <div
      ref={wrapperRef}
      className={classNames(styles.inputNumberWrapper, wrapperClassName)}
    >
      {addonAfter ? (
        // antd v6 deprecated `addonAfter` in favour of Space.Compact + Space.Addon
        <Space.Compact className={styles.compact}>
          {input}
          <Space.Addon>{addonAfter}</Space.Addon>
        </Space.Compact>
      ) : (
        input
      )}
    </div>
  );
};

export default InputNumber;
