import { RefObject, useLayoutEffect, useState } from "react";

interface Params {
  /** 开了 `virtual` 才量；关着时不挂任何监听 */
  enabled: boolean;
  /**
   * 外层这一刻挂没挂上。没有列时组件整个返回 null，外层要等列来了才出现 ——
   * 不把它放进依赖，监听就永远挂不上。
   */
  mounted: boolean;
  /** 包住 antd Table 的那层（虚拟模式下它占满父级剩余高度） */
  wrapperRef: RefObject<HTMLDivElement>;
  /** 各列（含序号列、选择列）宽度之和，给 `scroll.x` */
  columnsWidth: number;
}

/**
 * 虚拟滚动要的**数字**尺寸。
 *
 * antd 的虚拟表格（@rc-component/table 的 VirtualTable）只认数字的 `scroll.x / scroll.y`：
 * 不是数字时 y 退回 500、x 退回 1，并在控制台报 `scroll.y in virtual table must be number`。
 * 本组件的非虚拟滚动靠 CSS 撑满父级（`scroll={{ y: "" }}` ＋ flex），这条路在虚拟模式下
 * 走不通 —— 此前 `virtual` 时干脆不传 `scroll`，结果虚拟化根本没启用：1069 行 × 44 列的表
 * 照样画出 4.8 万个格子、首屏 10 秒（同样数据给了数字尺寸是 67ms、只画 9 行）。
 *
 * 所以这里量：`y` = 外层可用高度 − 表头高度（表头在虚拟模式下是独立的一块，不在滚动区里），
 * 父级尺寸一变（拖宽了面板、窗口缩放）就重量。量出来之前返回 `undefined`，调用方据此先不画表。
 */
const useVirtualScroll = ({
  enabled,
  mounted,
  wrapperRef,
  columnsWidth,
}: Params) => {
  const [y, setY] = useState<number>();

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!enabled || !wrapper) {
      return;
    }
    const measure = () => {
      const header = wrapper.querySelector<HTMLElement>(".ant-table-header");
      const next = Math.floor(
        wrapper.clientHeight - (header?.offsetHeight ?? 0),
      );
      // 父级还没排好版（0 高）时不写：写个 0 进去等于一行都不画
      setY((prev) => (next > 0 && next !== prev ? next : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    // 表头是表画出来之后才有的，高度也会随列标题折行变 —— 它出现 / 变高都要重量
    const mo = new MutationObserver(() => {
      const header = wrapper.querySelector<HTMLElement>(".ant-table-header");
      if (header) {
        ro.observe(header);
      }
      measure();
    });
    mo.observe(wrapper, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [enabled, mounted, wrapperRef]);

  return enabled && y ? { x: columnsWidth, y } : undefined;
};

export default useVirtualScroll;
