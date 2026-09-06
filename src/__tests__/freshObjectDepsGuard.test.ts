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

/** `文件相对路径::依赖名` → 无害的理由（确实无害才登记这里） */
const ALLOWED: Record<string, string> = {};

/**
 * 存量欠账：守卫上线（2.5.6）时就已经存在的命中。**它们不是无害的**，只是不在这
 * 一轮的改动范围内（这轮只修 Chart 一族）。修法与 Chart 相同：rest 包走
 * `useShallowStable`，字面量默认值提到模块级常量。
 *
 * 这份名单**只许变短**——下面「只许变短」那条用例会在某项修好却忘了删时报错。
 * 新写的代码一律直接失败，不许往这里加。
 */
const KNOWN_DEBT = [
  "components/Checkbox/CheckboxGroup/index.tsx::options",
  "components/FormItem/FormCodeMirror/index.tsx::rules",
  "components/FormItem/ItemContainer/index.tsx::tipsConfig",
  "components/Operate/index.tsx::menu",
  "components/Pagination/index.tsx::pageSizeOptions",
  "components/Panel/ListPanel/ListModalPanel/index.tsx::modalConfig",
  "components/Search/_hooks/useSearchCommon.ts::moreSearchItems",
  "components/Select/AutoCompleteSelect/index.tsx::options",
  "components/Spreadsheet/index.tsx::xOptionsRest",
  "components/Table/_hooks/useTableColumns.tsx::columns",
  "components/Tree/index.tsx::treeData",
];

interface Hit {
  /** `文件相对路径::依赖名` */
  key: string;
  file: string;
  line: number;
  why: string;
}

function scan(): Hit[] {
  const hits: Hit[] = [];

  for (const file of walkSources(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join("/");
    const src = stripComments(fs.readFileSync(file, "utf8"));
    const fresh = freshObjectBindings(src);
    if (!fresh.size) continue;

    for (const [line, dep] of hookDeps(src, HOOK_RE)) {
      const why = fresh.get(dep);
      if (!why) continue;
      hits.push({ key: `${rel}::${dep}`, file: rel, line, why });
    }
  }

  return hits;
}

describe("每次渲染都新建的对象不进 hook 依赖数组", () => {
  it("全库无未登记的新命中", () => {
    const offenders = scan()
      .filter(({ key }) => !ALLOWED[key] && !KNOWN_DEBT.includes(key))
      .map(({ file, line, why }) => `${file}:${line}  ${why}`);

    expect(offenders).toEqual([]);
  });

  it("Chart 一族一条都不剩（这一轮修的就是它）", () => {
    const chartHits = scan()
      .filter(({ file }) => file.startsWith("components/Chart/"))
      .map(({ key, line }) => `${key}@${line}`);

    expect(chartHits).toEqual([]);
  });

  it("存量欠账名单只许变短", () => {
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

    // 注释里的示例代码不算命中
    expect(
      freshObjectBindings(
        stripComments(`/** const { ...coreOption } = props; */\nconst a = 1;`),
      ).size,
    ).toBe(0);
  });
});
