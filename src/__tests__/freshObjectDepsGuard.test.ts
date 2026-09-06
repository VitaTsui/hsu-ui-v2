import path from "node:path";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  freshObjectBindings,
  hookDeps,
  stripComments,
  walkSources,
} from "./depsScan";

/**
 * 防回归守卫：**每次渲染都新建的对象不许进 hook 依赖数组**。
 *
 * React 的依赖数组按 `Object.is` 比引用。依赖里只要有一个「组件自己每次渲染新建
 * 的对象」，`useMemo` 就**恒不命中**、`useEffect` 就**每渲染必重跑**。
 * 组件内部最常见的两个来源：
 *
 * ```tsx
 * const { className, ...coreOption } = props;   // rest 包，每次都是新对象
 * const { inRangeColor = ["#fff"] } = props;    // 字面量默认值，不传时每次都是新数组
 * ```
 *
 * 这条缺陷和回调那条一样没有任何信号：不报错、不崩，只是图表每渲染一次就
 * `setOption(notMerge)` 整个重设——动画重播、鼠标悬浮态被清掉，人工 review 拦不住。
 *
 * 正确写法：
 * - rest 包 → `useShallowStable(rest)`（见 `src/hooks/useShallowStable.ts`）；
 * - 字面量默认值 → 提到模块级常量。
 */

const SRC = path.resolve(__dirname, "..");
const HOOK_RE = /use(?:Memo|Callback|(?:Layout)?Effect)\(/g;

/**
 * 正式白名单：`文件相对路径::依赖名` → `{ raw, why }`。
 *
 * 只登记**经过逐处判断、确认不是缺陷**的写法，且必须精确到依赖原文 `raw`：
 * 同一个绑定换一种写法（比如从 `x.open` 变成裸 `x`）就不再匹配，会照常失败。
 * 这样白名单不会变成整文件整绑定的免死金牌。
 */
const ALLOWED: Record<string, { raw: string; why: string }> = {
  "components/Panel/ListPanel/ListModalPanel/index.tsx::modalConfig": {
    raw: "modalConfig.open",
    why: "依赖取的是 modalConfig.open 这个布尔值，不是那个新对象本身；布尔值按值比较，effect 只在弹窗真的开合时重跑，不存在恒不命中",
  },
};

/**
 * 存量欠账：守卫上线（2.5.6）时就已经存在的命中。2.5.7 已逐处清完，名单为空。
 *
 * 这份名单**只许变短**——下面「只许变短」那条用例会在某项修好却忘了删时报错。
 * 新写的代码一律直接失败，不许往这里加。
 */
const KNOWN_DEBT: string[] = [];

interface Hit {
  /** `文件相对路径::依赖名` */
  key: string;
  file: string;
  line: number;
  /** 依赖数组里的原文（`x` 还是 `x.open`），白名单按它精确匹配 */
  raw: string;
  why: string;
}

function scan(): Hit[] {
  const hits: Hit[] = [];

  for (const file of walkSources(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join("/");
    const src = stripComments(fs.readFileSync(file, "utf8"));
    const fresh = freshObjectBindings(src);
    if (!fresh.size) continue;

    for (const [line, dep, raw] of hookDeps(src, HOOK_RE)) {
      const why = fresh.get(dep);
      if (!why) continue;
      hits.push({ key: `${rel}::${dep}`, file: rel, line, raw, why });
    }
  }

  return hits;
}

describe("每次渲染都新建的对象不进 hook 依赖数组", () => {
  it("全库无未登记的新命中", () => {
    const offenders = scan()
      .filter(({ key, raw }) => ALLOWED[key]?.raw !== raw && !KNOWN_DEBT.includes(key))
      .map(({ file, line, why }) => `${file}:${line}  ${why}`);

    expect(offenders).toEqual([]);
  });

  it("白名单不许留过期条目（对应写法改掉了就删掉它）", () => {
    const live = new Set(scan().map(({ key, raw }) => `${key}::${raw}`));
    expect(
      Object.entries(ALLOWED)
        .filter(([key, { raw }]) => !live.has(`${key}::${raw}`))
        .map(([key]) => key),
    ).toEqual([]);
  });

  it("Chart 一族一条都不剩（2.5.6 修的就是它）", () => {
    const chartHits = scan()
      .filter(({ file }) => file.startsWith("components/Chart/"))
      .map(({ key, line }) => `${key}@${line}`);

    expect(chartHits).toEqual([]);
  });

  it("存量欠账名单只许变短（2.5.7 起应恒为空）", () => {
    const live = new Set(scan().map(({ key }) => key));
    // 修好了就把它从 KNOWN_DEBT 里删掉，别留着已经不存在的条目
    expect(KNOWN_DEBT.filter((key) => !live.has(key))).toEqual([]);
  });

  it("守卫本身能抓到问题（自测）", () => {
    const restCase = `
      const { className, ...coreOption } = props;
      const option = useMemo(() => ({ ...coreOption }), [coreOption]);
    `;
    expect(freshObjectBindings(restCase).has("coreOption")).toBe(true);
    expect(hookDeps(restCase, HOOK_RE).map(([, d]) => d)).toContain(
      "coreOption",
    );

    const defaultCase = `
      const { colors = ["#fff"], size = { w: 1 }, name = "x" } = props;
      useEffect(() => {}, [colors, size, name]);
    `;
    const fresh = freshObjectBindings(defaultCase);
    expect(fresh.has("colors")).toBe(true);
    expect(fresh.has("size")).toBe(true);
    // 原始值默认值不是新对象，不该被误判
    expect(fresh.has("name")).toBe(false);

    // 稳定引用（useShallowStable 的返回值 / 模块级常量）不该被误判
    const fixed = `
      const { className, ...restOption } = props;
      const coreOption = useShallowStable(restOption);
      const option = useMemo(() => ({ ...coreOption }), [coreOption]);
    `;
    expect(freshObjectBindings(fixed).has("coreOption")).toBe(false);

    // 回调体里出现过 `, [`（JSX 的 classNames 常写成这样）时，依赖数组仍要切对：
    // 旧的贪婪正则会从最左那个 `, [` 起一路吞到结尾，把真命中静默漏掉
    const jsxCase = `
      const { colors = ["#fff"] } = props;
      const node = useMemo(() => (
        <span className={classNames(styles.a, { [styles.b]: on })} />
      ), [colors, on]);
    `;
    expect(hookDeps(jsxCase, HOOK_RE).map(([, d]) => d)).toEqual([
      "colors",
      "on",
    ]);

    // 依赖原文要原样带出来，白名单才能按 `x` / `x.open` 精确区分
    expect(
      hookDeps(`useEffect(() => {}, [cfg.open, cfg]);`, HOOK_RE).map(
        ([, , raw]) => raw,
      ),
    ).toEqual(["cfg.open", "cfg"]);

    // 最后一个实参不是依赖数组时不算依赖（例如 `useMemo(() => [1, 2])`）
    expect(hookDeps(`const a = useMemo(() => [x, y]);`, HOOK_RE)).toEqual([]);

    // 注释里的示例代码不算命中
    expect(
      freshObjectBindings(
        stripComments(`/** const { ...coreOption } = props; */\nconst a = 1;`),
      ).size,
    ).toBe(0);
  });
});
