import { RefObject, useLayoutEffect, useState } from "react";

/**
 * 浮层的横坐标（`left`）归这个 hook 管，其余交给 antd。
 *
 * ## 为什么还要自己算 left
 *
 * antd 是把浮层对到**它自己的触发节点**（`.ant-select`）上的，而 `Select` /
 * `AutoCompleteSelect` 在触发节点外面还画了一层外壳（`index.module.scss` 里 `.select`
 * 的 `1px` 边框 ＋ `0 11px` 内边距，实测外壳比触发节点靠左 **12px**），浮层宽度又是按
 * **外壳**的 `offsetWidth` 给的。两边不同源，照 antd 的 left 摆就会整体右移 12px、
 * 右边缘探出控件 12px。所以 left 这一项按外壳测，用 `styles.popup.root.left`
 * 覆盖掉 antd 那一份；纵坐标、翻转、贴边收拢仍然是 antd 自己在算。
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
 * 换成事件驱动之后还顺手修掉一个真缺陷：旧的 left 是**渲染期**读一次就定死，窗口
 * resize 时控件横向移动了但组件不重渲染，浮层就钉在原地 —— 实测 1512→1200 之后
 * 浮层比触发元素偏了 156px。现在 resize / 滚动 / 控件尺寸变化都会重新量。
 *
 * 监听范围和 antd 自己的对齐时机一致（`@rc-component/trigger` 的 `useWatch`：
 * 目标与浮层的可滚动祖先的 `scroll` ＋ 窗口 `resize`，外加对目标的 `ResizeObserver`），
 * 所以不会出现「antd 重排了、我们没跟上」的半拍错位。
 *
 * @param containerRef 外壳节点（`TreeSelect` 没有外壳，传的就是触发节点本身）
 * @param open 浮层是否展开；收起时不挂监听
 * @returns 外壳左边缘的视口坐标；还没量到时是 `undefined`（此时交给 antd 定位）
 */
export const useSelectPopupLeft = (
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
): number | undefined => {
  const [left, setLeft] = useState<number>();

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const measure = () => {
      const next = container.getBoundingClientRect().left;

      setLeft((prev) => (prev === next ? prev : next));
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

  return left;
};
