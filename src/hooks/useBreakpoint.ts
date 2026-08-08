import { useEffect, useState } from "react";

import { breakpoints } from "../styles/tokens";

export type BreakpointName = keyof typeof breakpoints;

export interface BreakpointState {
  /** 当前命中的最大断点；视口比 sm 还窄时为 `xs` */
  current: BreakpointName | "xs";
  /** 视口 >= 对应断点 */
  up: Record<BreakpointName, boolean>;
  /** 视口 < 对应断点 */
  down: Record<BreakpointName, boolean>;
  /** `< md`，用于「这是不是手机」这类粗判断 */
  isMobile: boolean;
}

const NAMES = Object.keys(breakpoints) as BreakpointName[];

const read = (): BreakpointState => {
  const width =
    typeof window === "undefined" ? breakpoints.xl : window.innerWidth;

  const up = {} as Record<BreakpointName, boolean>;
  const down = {} as Record<BreakpointName, boolean>;
  let current: BreakpointName | "xs" = "xs";

  for (const name of NAMES) {
    const hit = width >= breakpoints[name];
    up[name] = hit;
    down[name] = !hit;
    if (hit) current = name;
  }

  return { current, up, down, isMobile: width < breakpoints.md };
};

/**
 * 当前视口命中的断点。
 *
 * 断点值与 `styles/_responsive.scss` 的 mixin 同源（都由 tokens.json 生成），所以 JS 里的判断
 * 不会和 CSS 里的媒体查询错开。
 *
 * 能用 CSS 解决的就别用它 —— 媒体查询不需要 JS 参与、没有首屏闪烁、也不会因 SSR 拿不到
 * `window` 而先渲染错一帧。只有当**结构**要变（比如小屏把表格换成卡片列表、把工具栏收进抽屉）
 * 时才需要它。
 */
const useBreakpoint = (): BreakpointState => {
  const [state, setState] = useState<BreakpointState>(read);

  useEffect(() => {
    const update = () => setState(read());
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return state;
};

export default useBreakpoint;
