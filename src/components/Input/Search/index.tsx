import { SearchProps as AntdSearchProps, InputRef } from "antd/es/input";
import React, { useEffect, useRef, useState } from "react";

import AntdSearch from "antd/es/input/Search";
import classNames from "classnames";
import styles from "./index.module.scss";
import { useLatestRef } from "../../../hooks/useLatestRef";

export interface SearchProps
  extends Omit<
    AntdSearchProps,
    "onCompositionStart" | "onCompositionEnd" | "ref" | "onChange"
  > {
  getRef?: (ref: InputRef | null) => void;
  onChange?: (value: string) => void;
}

const Search: React.FC<SearchProps> = (props) => {
  const { onChange, getRef, value, defaultValue, className, ...inputConfig } =
    props;
  const ref = useRef<InputRef>(null);
  const getRefRef = useLatestRef(getRef);
  // 输入法组字期间不往外通知。放 ref 不放 state：它只决定「要不要发通知」，
  // 不参与渲染，而且必须在同一次事件里立刻生效
  const composingRef = useRef(false);

  // On initialization, prefer value, then fall back to defaultValue
  const initialValue =
    value !== undefined
      ? value?.toString() ?? ""
      : defaultValue !== undefined
      ? defaultValue?.toString() ?? ""
      : "";

  const [_value, setValue] = useState<string>(initialValue);
  const prevValueRef = useRef<typeof value>(undefined);
  // 最近一次通知出去的原文。只用来去掉 compositionend 与 input 两个事件的重复通知
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
    // 全是空白等同于空
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

  // 只在挂载时把 ref 交出去。`getRef` 进依赖数组同样会被内联箭头带着每次渲染重跑
  useEffect(() => {
    getRefRef.current?.(ref.current);
  }, [getRefRef]);

  return (
    <AntdSearch
      ref={ref}
      className={classNames(styles.antdInput, className)}
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
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        if (!composingRef.current) notify(next);
      }}
      {...inputConfig}
    />
  );
};

export default Search;
