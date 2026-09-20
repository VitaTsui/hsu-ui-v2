import { RefObject, useLayoutEffect, useState } from "react";

/** 外壳量出来的几何：浮层要用的宽度，以及外壳与 antd 触发节点的左右差 */
export interface SelectPopupMetrics {
  /** 外壳的边框盒宽度；还没量到时是 `0` */
  width: number;
  /** antd 触发节点左缘比外壳左缘靠右多少；没有外壳时是 `0` */
  insetStart: number;
  /** 外壳右缘比 antd 触发节点右缘靠右多少；没有外壳时是 `0` */
  insetEnd: number;
}

const EMPTY: SelectPopupMetrics = { width: 0, insetStart: 0, insetEnd: 0 };

/**
 * 浮层要跟着外壳走的量归这个 hook 管，其余（包括**整条横向定位**）交给 antd。
 *
 * ## 为什么要量这两个差
 *
 * antd 是把浮层对到**它自己的触发节点**（`.ant-select`）上的，而 `Select` /
 * `AutoCompleteSelect` 在触发节点外面还画了一层外壳（`index.module.scss` 里 `.select`
 * 的 `1px` 边框 ＋ `0 11px` 内边距，还可能有 `prefix`），浮层宽度又是按**外壳**给的。
 * 两边不同源，照 antd 的对齐点摆就会整体右移、右边探出控件。
 *
 * 从前是量出外壳的 `left` 再用 `styles.popup.root.left` 盖掉 antd 那一份 —— 而内联
 * `popupStyle` 在 `@rc-component/trigger` 里是**最后**展开的
 * （`es/Popup/index.js:169` 的 `...style`），于是 antd 算好的 `offsetStyle.left`
 * 被整条盖掉，连带把**横向贴边收拢**（`adjustX`，浮层顶到视口边缘时翻到另一侧）
 * 一起盖没了：浮层比控件宽的时候（`popupMatchSelectWidth={false}` /
 * `popupMatchContentWidth`）就会直挺挺探出视口。
 *
 * 现在改成把这个差交给 `builtinPlacements` 的 `offset`：left 整条还给 antd 自己算，
 * `adjustX` 自动恢复。这里只负责量差，不再决定浮层摆在哪。
 *
 * 差不能写死 `-12`：外壳里有 `prefix` 时 antd 节点会再右移（实测三种控件分别是
 * 12 / 24 / 30px），所以每个实例自己量。
 *
 * ## 为什么宽度也得在这里量
 *
 * 宽度从前是在**渲染期**直接读一次 `container.offsetWidth` 就算完。
 * `ref.current.offsetWidth` 是一次性的读，既不是 state 也没有任何订阅，所以它只在
 * 「组件恰好因为别的原因重渲染」时才会被重新读到 —— 展开/收起会重渲染，于是看起来
 * 「好像是对的」；而窗口 resize 时控件变宽了组件并不重渲染，浮层宽度就钉在展开那一刻
 * 的旧值上。
 *
 * ## 为什么只剩 `ResizeObserver`
 *
 * 2.8.2/2.8.3 还挂着捕获阶段的 `scroll` ＋ 窗口 `resize`，那是 `left` 要的：控件横向
 * 移动了得重算坐标。`left` 还给 antd 之后，这里剩下的三个量**只跟盒子尺寸有关**，
 * 滚动一个都不会变；窗口 resize 只有在控件真的跟着变宽时才需要重测，而那正是
 * `ResizeObserver` 的正题。所以两个监听一并删掉，不留空转的订阅。
 *
 * @param containerRef 外壳节点（也是浮层宽度的来源）
 * @param triggerRef antd 自己的触发节点；`TreeSelect` 没有外壳，传 `null`
 * @param open 浮层是否展开；收起时不挂监听
 */
export const useSelectPopupMetrics = (
  containerRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null> | null,
  open: boolean,
): SelectPopupMetrics => {
  const [metrics, setMetrics] = useState<SelectPopupMetrics>(EMPTY);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const measure = () => {
      // 宽度沿用 `offsetWidth`（整数、边框盒），与 antd 自己给浮层算宽度的口径一致；
      // `getBoundingClientRect().width` 带小数且会被 transform 放大，换过去会平白改掉像素。
      const width = container.offsetWidth;
      const trigger = triggerRef?.current ?? null;

      let insetStart = 0;
      let insetEnd = 0;

      if (trigger && trigger !== container) {
        const containerRect = container.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();

        insetStart = triggerRect.left - containerRect.left;
        insetEnd = containerRect.right - triggerRect.right;
      }

      setMetrics((prev) =>
        prev.width === width &&
        prev.insetStart === insetStart &&
        prev.insetEnd === insetEnd
          ? prev
          : { width, insetStart, insetEnd },
      );
    };

    measure();

    if (!open) {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    // prefix 变宽时外壳尺寸可能没变、antd 节点却挪了位，所以触发节点也要盯着
    const trigger = triggerRef?.current;
    if (trigger && trigger !== container) {
      observer.observe(trigger);
    }

    return () => {
      observer.disconnect();
    };
  }, [containerRef, triggerRef, open]);

  return metrics;
};
