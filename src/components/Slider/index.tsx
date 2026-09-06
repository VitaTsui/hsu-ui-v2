import {
  Slider as AntdSlider,
  SliderSingleProps as AntdSliderSingleProps,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

import classNames from "classnames";
import styles from "./index.module.scss";

export interface SliderProps extends AntdSliderSingleProps {
  topValue?: number;
}

const Slider: React.FC<SliderProps> = (props) => {
  const { className, value = 0, topValue, onChange, ...sliderConfig } = props;
  const [_value, setValue] = useState<number>(value);
  // 最近一次通知出去的值，代替原来那个用 state 记账的写法
  const notifiedRef = useRef<number>(value);

  /**
   * `onChange` 是「用户拖了滑块」这个**事件**的通知，不是从 state 推导出来的结果，
   * 所以在事件处理里发，不在 effect 里发。详见 `Input/TextArea/index.tsx` 里那段
   * 说明——旧写法（依赖数组里放 `onChange`、体内又调它、用 state 记「通知过没有」）
   * 会让传内联箭头的消费方死循环。
   */
  const handleChange = (next: number) => {
    setValue(next);
    if (next === notifiedRef.current) return;
    notifiedRef.current = next;
    onChange?.(next);
  };

  // 外部值（`value` / `topValue`）变了才回写，不跟着通知走
  useEffect(() => {
    const next = topValue || value;
    if (next !== notifiedRef.current) {
      notifiedRef.current = next;
      setValue(next);
    }
  }, [topValue, value]);

  return (
    <AntdSlider
      className={classNames([styles.slider, className])}
      tooltip={{ open: false }}
      value={_value}
      onChange={handleChange}
      {...sliderConfig}
    />
  );
};

export default Slider;
