import { RefObject, useLayoutEffect, useState } from "react";

/** 外壳量出来的几何：浮层要用的横坐标与宽度 */
export interface SelectPopupRect {
  /** 外壳左边缘的视口坐标；还没量到时是 `undefined`（此时交给 antd 定位） */
  left: number | undefined;
  /** 外壳的边框盒宽度；还没量到时是 `0` */
  width: number;
}

/**
 * 浮层要跟着外壳走的两个量 —— 横坐标（`left`）和宽度 —— 归这个 hook 管，其余交给 antd。
 *
 * ## 为什么 left 要自己算
 *
 * antd 是把浮层对到**它自己的触发节点**（`.ant-select`）上的，而 `Select` /
 * `AutoCompleteSelect` 在触发节点外面还画了一层外壳（`index.module.scss` 里 `.select`
 * 的 `1px` 边框 ＋ `0 11px` 内边距，实测外壳比触发节点靠左 **12px**），浮层宽度又是按
 * **外壳**给的。两边不同源，照 antd 的 left 摆就会整体右移 12px、右边缘探出控件 12px。
 * 所以 left 这一项按外壳测，用 `styles.popup.root.left` 覆盖掉 antd 那一份；纵坐标、
 * 翻转仍然是 antd 自己在算。
 *
 * ## 为什么宽度也得在这里量
 *
 * 宽度从前是在**渲染期**直接读一次 `container.offsetWidth` 就算完
 * （`Select`、`AutoCompleteSelect`、`TreeSelect` 三处各写一份）。`ref.current.offsetWidth`
 * 是一次性的读，既不是 state 也没有任何订阅，所以它只在「组件恰好因为别的原因重渲染」
 * 时才会被重新读到 —— 展开/收起会重渲染，于是看起来「好像是对的」；而窗口 resize 时控件
 * 变宽了组件并不重渲染，浮层宽度就钉在展开那一刻的旧值上。
 *
 * left 这边 2.8.2 已经为了同一类问题挂上了 `ResizeObserver`（控件尺寸变化）＋ 捕获阶段
 * 的 `scroll` ＋ 窗口 `resize`，而「控件变宽」本来就是 `ResizeObserver` 的正题。所以宽度
 * 直接并进同一次测量、同一个观察者，不另开一套订阅，也就不会出现两套判断各测各的。
 *
 * ## 这里推翻了什么
 *
 * 旧实现是 `useSelectPopupPosition`：`setInterval(…, 1)` 每毫秒重算一次
 * `popup.style.inset`，浮层开着就一直烧 CPU（浏览器把 1ms 钳到 ~4ms，实测 10 秒内
 * 对触发元素做了 4992 次 `getBoundingClientRect`）。而且它只在「effect 跑的时候浮层
 * 已经在 DOM 里」才起得来 —— 首次展开时浮层还没渲染出来，`document.querySelector`
 * 拿到 null，定时器根本没建（实测首开 10 秒 0 次）。也就是说首开的定位从来都是 antd
 * ＋ 这份 left 覆盖做的，轮询只是从第二次展开起把同一个结果每秒重算 250 遍。
 *
 * 监听范围和 antd 自己的对齐时机一致（`@rc-component/trigger` 的 `useWatch`：
 * 目标与浮层的可滚动祖先的 `scroll` ＋ 窗口 `resize`，外加对目标的 `ResizeObserver`），
 * 所以不会出现「antd 重排了、我们没跟上」的半拍错位。
 *
 * @param containerRef 外壳节点（`TreeSelect` 没有外壳，传的就是触发节点本身）
 * @param open 浮层是否展开；收起时不挂监听
 */
export const useSelectPopupRect = (
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
): SelectPopupRect => {
  const [rect, setRect] = useState<SelectPopupRect>({
    left: undefined,
    width: 0,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const measure = () => {
      const left = container.getBoundingClientRect().left;
      // 宽度沿用 `offsetWidth`（整数、边框盒），与 antd 自己给浮层算宽度的口径一致；
      // `getBoundingClientRect().width` 带小数且会被 transform 放大，换过去会平白改掉像素。
      const width = container.offsetWidth;

      setRect((prev) =>
        prev.left === left && prev.width === width ? prev : { left, width },
      );
    };

    measure();

    if (!open) {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    // scroll 不冒泡，但会经过捕获阶段，所以在 window 上捕获一次就能收到任何祖先的滚动
    window.addEventListener("scroll", measure, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, open]);

  return rect;
};
