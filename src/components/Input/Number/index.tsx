import {
  InputNumber as AntdInputNumber,
  InputNumberProps as AntdInputNumberProps,
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

  // Dynamically compute the width of addonAfter and set the CSS variable
  useEffect(() => {
    if (addonAfter && wrapperRef.current) {
      const updateAddonWidth = () => {
        const addonElement = wrapperRef.current?.querySelector(
          ".ant-input-number-group-addon",
        ) as HTMLElement | null;
        if (addonElement && addonElement.offsetWidth > 0) {
          wrapperRef.current?.style.setProperty(
            "--addon-after-width",
            `${addonElement.offsetWidth}px`,
          );
        }
      };

      // Use requestAnimationFrame to ensure the DOM has rendered before computing
      const rafId = requestAnimationFrame(() => {
        updateAddonWidth();
      });

      // Observe window and element size changes to recompute
      const resizeObserver = new ResizeObserver(() => {
        updateAddonWidth();
      });

      if (wrapperRef.current) {
        const addonElement = wrapperRef.current.querySelector(
          ".ant-input-number-group-addon",
        ) as HTMLElement | null;
        if (addonElement) {
          resizeObserver.observe(addonElement);
        }
      }

      return () => {
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
      };
    }
  }, [addonAfter]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("");
    setLastValue("");
    onChange?.("");
  };

  const showClear =
    allowClear && _value !== "" && _value !== undefined && !disabled;

  return (
    <div
      ref={wrapperRef}
      className={classNames(styles.inputNumberWrapper, wrapperClassName, {
        [styles.inputNumberWrapperClear]: showClear,
        [styles.hasAddonAfter]: !!addonAfter,
      })}
    >
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
        addonAfter={addonAfter}
        {...inputConfig}
        stringMode
      />
      {showClear && (
        <CloseCircleFilled className={styles.clearIcon} onClick={handleClear} />
      )}
    </div>
  );
};

export default InputNumber;
