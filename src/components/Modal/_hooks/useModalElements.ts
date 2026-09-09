import { useEffect, useMemo, useState } from "react";
import { generateRandomStr } from "hsu-utils";

interface UseModalElementsProps {
  open?: boolean;
  /**
   * 只有能拖的弹窗才需要真的去找这两个元素 —— `useModalDrag` 在 `!moveable` 时
   * 第一行就 return，找到了也没人用。
   */
  moveable?: boolean;
}

/** 找 header 的最长时限（毫秒）。它由 antd 在同一次提交里渲染，正常第一帧就在。 */
const LOOKUP_BUDGET = 1000;

/**
 * Locate and manage Modal DOM elements
 */
export function useModalElements({ open, moveable = true }: UseModalElementsProps) {
  const cls = useMemo(() => generateRandomStr(10), []);
  const [modal, setModal] = useState<HTMLElement | null>(null);
  const [modalHeader, setModalHeader] = useState<HTMLElement | null>(null);
  const [originalStyle, setOriginalStyle] = useState<string | null>(null);

  useEffect(() => {
    // 不能拖就不必找：省掉一整轮 DOM 查询，也堵死下面那条死循环的入口
    if (!moveable || !open || modal || modalHeader) {
      return;
    }

    /*
     * 这里原来是 `setInterval(…, 1)`，且 `clearInterval` **只写在「找到了」那条分支里**。
     * 于是 `title={null}` 的弹窗（antd 压根不渲染 header，`.${cls}` 永远查不到）
     * 一开就留下一条**永不停止**的轮询：实测约 250 次 `document.querySelector`/秒，
     * 关掉弹窗也不停，一直跑到页面卸载 —— 主线程被它长期占着，弹窗的进出场动画
     * 会掉帧甚至丢掉收尾回调，表现为遮罩收不回去、整页点不动。
     *
     * 改成 rAF ＋ 有限时限：找到就停，找不到到点也停，两条路都收敛。
     */
    let raf = 0;
    const deadline = Date.now() + LOOKUP_BUDGET;

    const look = () => {
      const header = document.querySelector<HTMLElement>(`.${cls}`);

      if (header) {
        setModalHeader(header);

        const _modal = header.closest<HTMLElement>(".ant-modal");
        setModal(_modal);
        setOriginalStyle(_modal?.getAttribute("style") ?? null);
        return;
      }

      if (Date.now() < deadline) {
        raf = requestAnimationFrame(look);
      }
    };

    raf = requestAnimationFrame(look);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [cls, modal, modalHeader, moveable, open]);

  return {
    cls,
    modal,
    modalHeader,
    originalStyle,
    setModal,
    setModalHeader,
    setOriginalStyle,
  };
}
