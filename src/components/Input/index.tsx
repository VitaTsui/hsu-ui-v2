import {
  Input as AntdInput,
  InputProps as AntdInputProps,
  InputRef,
  Tooltip,
  TooltipProps,
} from "antd";
import InputNumber, { InputNumberProps } from "./Number";
import Password, { PasswordProps } from "./Password";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Search, { SearchProps } from "./Search";
import TextArea, { TextAreaProps } from "./TextArea";

import classNames from "classnames";
import styles from "./index.module.scss";
import RangeInput, { RangeInputProps } from "./Range";
import { useLatestRef } from "../../hooks/useLatestRef";

export interface InputProps extends Omit<
  AntdInputProps,
  "onCompositionStart" | "onCompositionEnd" | "ref" | "onChange"
> {
  getRef?: (ref: InputRef | null) => void;
  onChange?: (value: string) => void;
  en?: boolean;
  word?: boolean;
  tooltip?: TooltipProps;
  escapeCharacters?: string[];
}

interface InputFC extends React.FC<InputProps> {
  Search: React.FC<SearchProps>;
  TextArea: React.FC<TextAreaProps>;
  Password: React.FC<PasswordProps>;
  Number: React.FC<InputNumberProps>;
  Range: React.FC<RangeInputProps>;
  /** antd v6 新增的验证码输入框 */
  OTP: typeof AntdInput.OTP;
}

const Input: InputFC = (props) => {
  const {
    onChange,
    getRef,
    className,
    type,
    value,
    defaultValue,
    en = false,
    maxLength,
    disabled,
    placeholder,
    tooltip,
    escapeCharacters,
    ...inputConfig
  } = props;
  const ref = useRef<InputRef>(null);
  const getRefRef = useLatestRef(getRef);
  // 输入法组字期间不往外通知。放 ref 不放 state：它只决定「要不要发通知」，
  // 不参与渲染，而且必须在同一次事件里立刻生效
  const composingRef = useRef(false);

  // Handle escaping: if the value contains characters listed in escapeCharacters, prefix them with an escape
  const escapeValue = useCallback(
    (val: string): string => {
      if (!escapeCharacters || escapeCharacters.length === 0) {
        return val;
      }

      let result = "";
      let i = 0;
      while (i < val.length) {
        const char = val[i];
        // Check if this is an escape character and the next character is one that needs escaping
        if (char === "\\" && i + 1 < val.length) {
          const nextChar = val[i + 1];
          // If the next character is one that needs escaping, it is already escaped; append as is
          if (escapeCharacters.includes(nextChar)) {
            result += char + nextChar;
            i += 2;
            continue;
          }
        }
        // If the current character needs escaping and is not already preceded by an escape, add the escape character
        if (escapeCharacters.includes(char)) {
          // Check whether an escape character already precedes it (avoid double escaping)
          if (i === 0 || val[i - 1] !== "\\") {
            result += "\\" + char;
          } else {
            result += char;
          }
        } else {
          result += char;
        }
        i++;
      }
      return result;
    },
    [escapeCharacters],
  );

  // Handle unescaping: if the value contains escaped sequences, remove the escapes
  const unescapeValue = useCallback(
    (val: string): string => {
      if (!escapeCharacters || escapeCharacters.length === 0) {
        return val;
      }

      let result = "";
      let i = 0;
      while (i < val.length) {
        const char = val[i];
        // If the current character is a backslash and the next character is one that needs escaping
        if (char === "\\" && i + 1 < val.length) {
          const nextChar = val[i + 1];
          if (escapeCharacters.includes(nextChar)) {
            // Skip the backslash and append only the escaped character
            result += nextChar;
            i += 2;
            continue;
          }
        }
        result += char;
        i++;
      }
      return result;
    },
    [escapeCharacters],
  );

  // On initialization, prefer value, then fall back to defaultValue
  const getInitialValue = () => {
    const rawValue =
      value !== undefined
        ? typeof value === "number"
          ? `${value}`
          : (value?.toString() ?? "")
        : defaultValue !== undefined
          ? typeof defaultValue === "number"
            ? `${defaultValue}`
            : (defaultValue?.toString() ?? "")
          : "";
    return unescapeValue(rawValue);
  };

  const initialValue = getInitialValue();

  const [_value, setValue] = useState<string>(initialValue);
  const prevValueRef = useRef<typeof value>(undefined);
  // 最近一次通知出去的原文（未转义）。只用来去掉 compositionend 与 input
  // 两个事件的重复通知
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
    // 全是空白等同于空；escapeCharacters 命中时对外给转义后的值
    onChange?.(escapeValue(next.trim() === "" ? "" : next));
  };

  useEffect(() => {
    // Update internal state only when the external value prop actually changes
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;

      if (value !== undefined) {
        const rawValue =
          typeof value === "number" ? `${value}` : value?.toString();
        // Unescape before displaying
        const newValue = unescapeValue(rawValue);
        // 外部把值改了，之前通知过什么就不作数了，重新以外部值为准
        notifiedRef.current = newValue;
        setValue(newValue);
      } else {
        // Clear only on initialization or when explicitly set to undefined externally
        notifiedRef.current = "";
        setValue("");
      }
    }
  }, [value, unescapeValue]);

  // 只在挂载时把 ref 交出去。`getRef` 进依赖数组同样会被内联箭头带着每次渲染重跑
  useEffect(() => {
    getRefRef.current?.(ref.current);
  }, [getRefRef]);

  return (
    <Tooltip placement="topLeft" {...tooltip}>
      <AntdInput
        ref={ref}
        disabled={disabled}
        placeholder={disabled ? "" : placeholder}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          composingRef.current = false;
          // 组完字的那一下自己发通知。浏览器之间 compositionend 与 input 的先后
          // 不一致，`notify` 里按原文去重，两种顺序都只会发出一次
          notify(unescapeValue(e.currentTarget.value));
        }}
        value={_value}
        onChange={(e) => {
          // On user input, unescape first, then set into state
          const inputValue = e.target.value;
          const unescapedInput = unescapeValue(inputValue);
          setValue(unescapedInput);
          if (!composingRef.current) notify(unescapedInput);
        }}
        className={classNames(styles.antdInput, className)}
        type={type}
        maxLength={en ? undefined : maxLength}
        allowClear={true}
        {...inputConfig}
      />
    </Tooltip>
  );
};

Input.Search = Search;
Input.TextArea = TextArea;
Input.Password = Password;
Input.Number = InputNumber;
Input.Range = RangeInput;
// antd v6 新增的验证码输入框，原样透出
Input.OTP = AntdInput.OTP;

export default Input;
