import { useEffect, useState } from "react";

export interface PointerType {
  /** 主要输入设备是粗指针（手指、触控笔） */
  isCoarse: boolean;
  /** 设备具备真正的悬停能力（鼠标、触控板） */
  canHover: boolean;
  /** 粗指针且不能悬停 —— 通常意义上的「触屏设备」 */
  isTouch: boolean;
}

const QUERY_COARSE = "(pointer: coarse)";
const QUERY_HOVER = "(hover: hover)";

const read = (): PointerType => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return { isCoarse: false, canHover: true, isTouch: false };
  }

  const isCoarse = window.matchMedia(QUERY_COARSE).matches;
  const canHover = window.matchMedia(QUERY_HOVER).matches;

  return { isCoarse, canHover, isTouch: isCoarse && !canHover };
};

/**
 * 当前设备的指针能力。
 *
 * 刻意**不**做 UA 嗅探：二合一设备可以在触摸与鼠标之间来回切换，媒体查询会跟着变，UA 不会。
 *
 * 另外说明一个常见误解：不需要为了移动端把 `onClick` 换成 `onTouchStart`。触摸事件序列本来
 * 就会合成 click，`onClick` 在触屏上一直是能用的；换成 touch 反而会丢掉键盘可访问性、在滚动
 * 时误触发、并与合成的 click 重复触发。移动端真正要处理的是别的东西 —— 300ms 点击延迟
 * （用 `touch-action: manipulation`）、点完粘住不消的 `:hover`（用 `_responsive.scss` 的
 * `hover` mixin 包起来）、以及过小的点按目标。这个 hook 用于最后一类：需要按指针类型
 * **改变结构或尺寸**的场合。
 */
const usePointerType = (): PointerType => {
  const [state, setState] = useState<PointerType>(read);

  useEffect(() => {
    const update = () => setState(read());
    update();

    const coarse = window.matchMedia(QUERY_COARSE);
    const hover = window.matchMedia(QUERY_HOVER);
    coarse.addEventListener?.("change", update);
    hover.addEventListener?.("change", update);

    return () => {
      coarse.removeEventListener?.("change", update);
      hover.removeEventListener?.("change", update);
    };
  }, []);

  return state;
};

export default usePointerType;
