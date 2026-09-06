import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hookDeps, walkSources } from "./depsScan";

/**
 * 防回归守卫：**回调 prop 不许进 effect 依赖数组**。
 *
 * 这条缺陷没有任何信号——不报错、不变慢，只是消费方一传内联箭头
 * （`onXxx={(v) => setV(v)}`，React 里最常见的写法）就重复订阅 / 重复通知，
 * 严重的直接死循环到 `Maximum update depth exceeded`。
 * 靠人工 review 拦不住，所以扫源码。
 *
 * 正确写法见 `src/hooks/useLatestRef.ts`：
 * - 调用取 ref 里的最新引用；
 * - 「有没有传回调」若决定要不要注册监听，就单独拆一个布尔量进依赖数组，
 *   这样「从无到有传入回调」仍会正确注册。
 *
 * 确实无害的写法登记在 ALLOWED 里，每条都要写清为什么无害。
 */

const SRC = path.resolve(__dirname, "..");

/** 回调型标识符：`onXxx` 形态，外加几个明确的出口型回调名 */
const EXTRA_CALLBACK_NAMES = new Set(["getImage", "labelRender"]);
const isCallbackDep = (name: string) =>
  (/^on[A-Z]/.test(name) && !name.endsWith("Ref")) ||
  EXTRA_CALLBACK_NAMES.has(name);

/** `文件相对路径::依赖名` → 无害的理由 */
const ALLOWED: Record<string, string> = {
  "components/Chat/ChatHistory/index.tsx::onScrollEnd":
    "只在 DOM scroll 监听里调，effect 体不调它；重订阅是同一节点上摘一个装一个，无副作用",
  "components/DatePicker/index.tsx::onChange":
    "纯 ref 同步 effect：effect 体只写 ref，不调回调、不订阅任何东西",
  "components/DatePicker/RangePicker/index.tsx::onChange":
    "同上，纯 ref 同步 effect",
  "components/Tree/index.tsx::onSelectPath": "同上，纯 ref 同步 effect",
};

const EFFECT_RE = /use(?:Layout)?Effect\(/g;
const effectDeps = (src: string) => hookDeps(src, EFFECT_RE);

describe("回调 prop 不进 effect 依赖数组", () => {
  it("全库无未登记的命中", () => {
    const offenders: string[] = [];

    for (const file of walkSources(SRC)) {
      const rel = path.relative(SRC, file).split(path.sep).join("/");
      const src = fs.readFileSync(file, "utf8");

      for (const [line, dep] of effectDeps(src)) {
        if (!isCallbackDep(dep)) continue;
        if (ALLOWED[`${rel}::${dep}`]) continue;
        offenders.push(`${rel}:${line}  ${dep}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("守卫本身能抓到问题（自测）", () => {
    const bad = `
      useEffect(() => {
        onDone?.();
      }, [value, onDone]);
    `;
    expect(effectDeps(bad).map(([, d]) => d)).toContain("onDone");
    expect(isCallbackDep("onDone")).toBe(true);
    expect(isCallbackDep("onDoneRef")).toBe(false);
  });
});
