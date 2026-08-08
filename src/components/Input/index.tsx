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
import { useDebounceEffect } from "ahooks";

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
  const [isComposing, setComposing] = useState<boolean>(false);
  const ref = useRef<InputRef>(null);

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
  const [lastValue, setLastValue] = useState<string>(initialValue);
  const prevValueRef = useRef<typeof value>(undefined);

  useDebounceEffect(
    () => {
      if (!isComposing && _value !== lastValue) {
        const trimmedValue = _value.trim();
        const finalValue = trimmedValue === "" ? "" : _value;
        setLastValue(finalValue);
        // If escapeCharacters is set and the value matches, return the escaped value
        const escapedValue = escapeValue(finalValue);
        onChange?.(escapedValue);
      }
    },
    [_value, isComposing, lastValue, onChange, escapeValue],
    {
      wait: 10,
    },
  );

  useEffect(() => {
    // Update internal state only when the external value prop actually changes
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;

      if (value !== undefined) {
        const rawValue =
          typeof value === "number" ? `${value}` : value?.toString();
        // Unescape before displaying
        const newValue = unescapeValue(rawValue);
        setValue(newValue);
        setLastValue(newValue);
      } else {
        // Clear only on initialization or when explicitly set to undefined externally
        setValue("");
        setLastValue("");
      }
    }
  }, [value, unescapeValue]);

  useEffect(() => {
    getRef?.(ref.current);
  }, [getRef]);

  return (
    <Tooltip placement="topLeft" {...tooltip}>
      <AntdInput
        ref={ref}
        disabled={disabled}
        placeholder={disabled ? "" : placeholder}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => {
          setTimeout(() => {
            setComposing(false);
          }, 1);
        }}
        value={_value}
        onChange={(e) => {
          // On user input, unescape first, then set into state
          const inputValue = e.target.value;
          const unescapedInput = unescapeValue(inputValue);
          setValue(unescapedInput);
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
