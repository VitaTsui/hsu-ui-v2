import {
  InputNumber as AntdInputNumber,
  InputNumberProps as AntdInputNumberProps,
  Space,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { CloseCircleFilled } from "@ant-design/icons";

import classNames from "classnames";
import styles from "./index.module.scss";
import type { InputNumberRef } from "../../../types/antd";
import { useLatestRef } from "../../../hooks/useLatestRef";

export interface InputNumberProps extends Omit<
  AntdInputNumberProps,
  "ref" | "onChange" | "value"
> {
  getRef?: (ref: HTMLInputElement | null) => void;
  onChange?: (value: string) => void;
  /**
   * 受控值。本组件内部**始终以字符串保存**（底层开了 antd 的 `stringMode`，
   * 为的是不丢大数精度），但外部传数字进来也接得住。
   */
  value?: string | number | null;
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
  const getRefRef = useLatestRef(getRef);

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
  const prevValueRef = useRef<typeof value>(undefined);
  // 最近一次通知出去的文本，代替原来那个用 state 记账的写法
  const notifiedRef = useRef<string>(initialValue);

  /**
   * `onChange` 是「用户改了输入」这个**事件**的通知，不是从 state 推导出来的结果，
   * 所以在事件处理里发，不在 effect 里发。详见 `TextArea/index.tsx` 里那段说明——
   * 旧写法（依赖数组里放 `onChange`、体内又调它、用 state 记「通知过没有」）
   * 会让传内联箭头的消费方死循环。
   */
  const notify = (next: string) => {
    if (next === notifiedRef.current) return;
    notifiedRef.current = next;
    onChange?.(next);
  };

  useEffect(() => {
    // Update internal state only when the external value prop actually changes
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;

      // 数值相等就不要回写文本。
      //
      // 上游把值转成数字之后（`FormItem` 的 INPUTNUMBER 默认就会转），一个
      // 回环会打回来：输入 "1." → onChange → 表单存 1 → value={1} 传回来。
      // 若照单全收地写成 "1"，用户刚敲的小数点当场消失、光标还会跳到末尾，
      // "1.50" 也会被改写成 "1.5"。
      //
      // 判据用**数值相等**而不是字符串相等：这几种写法（"1." / "1.50" / "+1"）
      // 表示的是同一个数，此时以用户正在敲的那份文本为准。
      const sameNumber =
        value !== undefined &&
        value !== null &&
        _value !== "" &&
        Number(value) === Number(_value);

      if (sameNumber) {
        // 只同步「已通知过的值」，不动正在编辑的文本
        notifiedRef.current = _value;
      } else if (value !== undefined && value !== null) {
        const newValue =
          typeof value === "number" ? `${value}` : value?.toString();
        // 外部把值改了，之前通知过什么就不作数了，重新以外部值为准
        notifiedRef.current = newValue;
        setValue(newValue);
      } else {
        // Clear only on initialization or when explicitly set to undefined/null externally
        notifiedRef.current = "";
        setValue("");
      }
    }
    // `_value` 是刻意不进依赖的：这个 effect 只该在**外部** value 变化时跑，
    // 把它加进来会让每次键入都重跑一遍，等于绕过上面那个 prevValueRef 判断
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // 只在挂载时把 ref 交出去。`getRef` 进依赖数组同样会被内联箭头带着每次渲染重跑
  useEffect(() => {
    getRefRef.current?.(ref.current);
  }, [getRefRef]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("");
    notify("");
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
        notify(newValue);
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
