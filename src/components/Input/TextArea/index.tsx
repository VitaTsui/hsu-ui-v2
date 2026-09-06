import AntdTextArea, {
  TextAreaProps as AntdTextAreaProps,
  TextAreaRef,
} from "antd/es/input/TextArea";
import React, { ReactNode, useEffect, useRef, useState } from "react";

import classNames from "classnames";
import styles from "./index.module.scss";
import { useLatestRef } from "../../../hooks/useLatestRef";

export interface TextAreaProps
  extends Omit<
    AntdTextAreaProps,
    "onCompositionStart" | "onCompositionEnd" | "ref" | "prefix" | "onChange"
  > {
  getRef?: (ref: TextAreaRef | null) => void;
  textAreaClassName?: string;
  suffix?: ReactNode;
  prefix?: ReactNode;
  onChange?: (value: string) => void;
  en?: boolean;
  text?: boolean;
  word?: boolean;
}

const TextArea: React.FC<TextAreaProps> = (props) => {
  const {
    onChange,
    getRef,
    className,
    onFocus,
    onBlur,
    textAreaClassName,
    prefix,
    suffix,
    value,
    defaultValue,
    disabled,
    en = false,
    maxLength,
    text,
    placeholder,
    autoSize,
    style,
    ...inputConfig
  } = props;
  const ref = useRef<TextAreaRef>(null);
  const [focused, setFocused] = useState<boolean>(false);

  // On initialization, prefer value, then fall back to defaultValue
  const initialValue =
    value !== undefined
      ? (value?.toString() ?? "")
      : defaultValue !== undefined
        ? (defaultValue?.toString() ?? "")
        : "";

  const [_value, setValue] = useState<string>(initialValue);
  const [hasError, setHasError] = useState<boolean>(false);
  const prevValueRef = useRef<typeof value>(undefined);

  const getRefRef = useLatestRef(getRef);

  // 输入法组字期间不往外通知。放 ref 不放 state：它只影响「要不要发通知」，
  // 不参与渲染，而且必须在同一次事件里立刻生效
  const composingRef = useRef(false);
  // 最近一次通知出去的原文。只用来去掉 compositionend 与 input 两个事件的重复通知
  const notifiedRef = useRef<string>(initialValue);

  /**
   * `onChange` 是「用户改了输入」这个**事件**的通知，不是从 state 推导出来的结果，
   * 所以它在事件处理里发，不在 effect 里发。
   *
   * 早先是一个 effect 在发：依赖数组里放着 `onChange`，effect 体内又调它，
   * 还用一个 `lastValue` state 记「这个值通知过没有」。两处都是错的——
   * 1. 消费方传内联箭头（`onChange={(v) => setX(v)}`，React 里最常见的写法）时
   *    每次渲染都是新引用，effect 每次渲染都重跑；
   * 2. 「通知过没有」的记账放在 React state 里就**不可靠**：父级用 MobX /
   *    `useSyncExternalStore` 这类外部 store 回写 `value` 时，React 会以更高的
   *    同步优先级重渲一次，effect 里排的那次 `setLastValue` 会被这一趟**跳过**，
   *    于是 effect 读到过期的记账、判定「还没通知」，再发一次 → 父级再回写 →
   *    死循环，React 抛 `Maximum update depth exceeded`，输入框被上层
   *    ErrorBoundary 整块摘掉。
   *
   * 现在 `onChange` 的引用稳不稳定完全不影响正确性：永远调到最新的那个回调，
   * 且只在真的有新文本时调一次。
   */
  const notify = (next: string) => {
    if (next === notifiedRef.current) return;
    notifiedRef.current = next;
    // 全是空白等同于空：外部拿到的是 ""，但输入框里用户敲的空格照旧留着
    onChange?.(next.trim() === "" ? "" : next);
  };

  useEffect(() => {
    // Update internal state only when the external value prop actually changes
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;

      // 外部把值改了，之前通知过什么就不作数了，重新以外部值为准
      const next = value !== undefined ? (value?.toString() ?? "") : "";
      notifiedRef.current = next;
      setValue(next);
    }
  }, [value]);

  // 只在挂载时把 ref 交出去。`getRef` 进依赖数组同样会被内联箭头带着每次渲染重跑，
  // 消费方在里面 setState 就是一个死循环
  useEffect(() => {
    getRefRef.current?.(ref.current);
  }, [getRefRef]);

  useEffect(() => {
    // Use a MutationObserver to watch for error state changes
    const checkError = () => {
      if (ref.current?.resizableTextArea?.textArea) {
        const textAreaElement = ref.current.resizableTextArea.textArea;
        const hasErrorClass = textAreaElement.classList.contains(
          "ant-input-status-error",
        );
        setHasError(hasErrorClass);
      }
    };

    // Initial check
    checkError();

    // Observe DOM changes
    if (ref.current?.resizableTextArea?.textArea) {
      const textAreaElement = ref.current.resizableTextArea.textArea;
      const observer = new MutationObserver(checkError);

      observer.observe(textAreaElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return (
    <div
      className={classNames({
        [styles.textarea]: true,
        [className ?? ""]: true,
        [styles.focused]: focused,
        [styles.disabled]: disabled,
        [styles.text]: text,
        [styles.hasError]: hasError,
      })}
      style={style}
    >
      {prefix}
      <AntdTextArea
        ref={ref}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          composingRef.current = false;
          // 组完字的那一下自己发通知。浏览器之间 compositionend 与 input 的先后
          // 不一致，`notify` 里按原文去重，两种顺序都只会发出一次
          notify(e.currentTarget.value);
        }}
        value={_value}
        autoSize={disabled && text ? autoSize || { minRows: 1 } : autoSize}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (!composingRef.current) notify(next);
        }}
        onFocus={(e) => {
          setFocused(true);

          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);

          onBlur?.(e);
        }}
        className={`${styles.antd_textarea} ${textAreaClassName ?? ""}`}
        disabled={disabled}
        placeholder={disabled ? "" : placeholder}
        maxLength={en ? undefined : maxLength}
        {...inputConfig}
      />
      {suffix}
    </div>
  );
};

export default TextArea;
