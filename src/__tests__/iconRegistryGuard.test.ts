import path from "node:path";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { walkSources } from "./depsScan";

// 从组件出口取：顺带触发 Icon 模块的注册副作用（组件本身在这个测试里不渲染）。
// 注册表由本库自己维护 —— `@iconify/react/offline` 不导出 `iconLoaded`，
// 而联网版那个 `iconLoaded` 读的是另一份 storage，在这里问了也是白问
import { isIconRegistered } from "../components/Icon";

/**
 * 防回归守卫：**本库写死的 iconify 图标名，必须全部已注册**。
 *
 * 缺陷长什么样：渲染走 `@iconify/react/offline`，没 `addCollection` 过的名字
 * **一律画不出来**。本库在几十处组件里写死了图标名，而这些名字在消费方源码里
 * 一个字都搜不到 —— 消费方既扫不到、也不会想到要注册。漏一枚就是一个空格子，
 * **控制台一条错都没有**，只能靠肉眼发现。
 *
 * 这条守卫存在的意义就是「没有信号」这四个字：漏注册一枚不会报错、不会变慢，
 * 只会在某个页面上悄悄空一个格子。所以必须由机器每次跑一遍。
 *
 * 新增图标名后跑 `npm run icons` 重新生成子集即可；忘了跑，这条测试会点名。
 */

const SRC = path.resolve(__dirname, "..");

/**
 * 与 scripts/gen-icon-data.cjs 同一条判据：先按 `"前缀:名字"` 捞候选，
 * 再用「@iconify/json 里确实有这个集、且名字真解析得出来」筛掉假阳性
 * （`"00:00"`、CSS 值、i18n key 这类）。
 */
const ICON_NAME_RE =
  /["'`]([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)["'`]/g;

const JSON_DIR = path.resolve(
  __dirname,
  "../../node_modules/@iconify/json/json"
);

const sourceCache = new Map<string, { icons?: Record<string, unknown>; aliases?: Record<string, { parent?: string }> } | null>();

function loadSet(prefix: string) {
  if (sourceCache.has(prefix)) return sourceCache.get(prefix)!;
  const file = path.join(JSON_DIR, `${prefix}.json`);
  let source = null;
  if (fs.existsSync(file)) source = JSON.parse(fs.readFileSync(file, "utf8"));
  sourceCache.set(prefix, source);
  return source;
}

function existsInSet(prefix: string, name: string, seen = new Set<string>()): boolean {
  const source = loadSet(prefix);
  if (!source || seen.has(name)) return false;
  seen.add(name);
  if (source.icons?.[name]) return true;
  const alias = source.aliases?.[name];
  if (alias) return alias.parent ? existsInSet(prefix, alias.parent, seen) : true;
  return false;
}

function collectIconNames() {
  const found = new Map<string, string>(); // "prefix:name" -> "相对路径:行号"
  /** 前缀是本库确实在用的图标集、名字却解析不出来 —— 基本只可能是拼错了 */
  const typos = new Map<string, string>();
  const raw: Array<[string, string, string]> = [];

  for (const file of walkSources(SRC)) {
    // 生成物自己就是注册数据，扫它等于自我循环
    if (file.endsWith("collections.generated.ts")) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      ICON_NAME_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = ICON_NAME_RE.exec(line))) {
        const [, prefix, name] = m;
        raw.push([prefix, name, `${path.relative(SRC, file)}:${i + 1}`]);
      }
    });
  }

  for (const [prefix, name, where] of raw) {
    const key = `${prefix}:${name}`;
    if (existsInSet(prefix, name)) {
      if (!found.has(key)) found.set(key, where);
    }
  }

  /**
   * 拼错的图标名是这条缺陷最阴的一种形态：它同样只是悄悄空白，而上面那条
   * 「已注册」断言**抓不到它** —— 拼错的名字在 @iconify/json 里根本不存在，
   * 于是既不会进生成物、也不会被收进 found，整个从守卫眼皮底下溜走。
   * （写这条测试的过程中就真拼错过一次 `ant-design:delete-bin-outlined`。）
   *
   * 判据收紧到「前缀是本库其它地方确实用过的图标集」，避免把普通字符串
   * （时间、CSS 值、i18n key）误判成拼错的图标名。
   */
  const usedPrefixes = new Set([...found.keys()].map((k) => k.split(":")[0]));
  for (const [prefix, name, where] of raw) {
    const key = `${prefix}:${name}`;
    if (found.has(key) || typos.has(key)) continue;
    if (usedPrefixes.has(prefix) && !existsInSet(prefix, name))
      typos.set(key, where);
  }

  return { found, typos };
}

describe("iconify 图标注册守卫", () => {
  const { found: names, typos } = collectIconNames();

  it("扫得到本库写死的图标名（守卫本身没瞎）", () => {
    expect(names.size).toBeGreaterThan(30);
  });

  it("没有拼错的图标名（拼错的同样静默空白，且不会出现在注册表里）", () => {
    const wrong = [...typos.entries()].map(
      ([name, where]) => `${name}  <-  ${where}`
    );
    expect(
      wrong,
      wrong.length
        ? `以下图标名在它所属的图标集里查无此图标，基本可以断定是拼错了 —— 运行时画不出来且不报错：\n${wrong.join("\n")}`
        : ""
    ).toEqual([]);
  });

  it("每一枚都已注册，不会静默空白", () => {
    const unregistered = [...names.entries()]
      .filter(([name]) => !isIconRegistered(name))
      .map(([name, where]) => `${name}  <-  ${where}`);

    expect(
      unregistered,
      unregistered.length
        ? `以下图标没进 src/components/Icon/collections.generated.ts，运行时画不出来（空白且不报错）。跑 \`npm run icons\` 重新生成：\n${unregistered.join("\n")}`
        : ""
    ).toEqual([]);
  });
});
