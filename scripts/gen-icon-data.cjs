#!/usr/bin/env node
/**
 * 从 src/ 里实际写死的 iconify 图标名，生成 src/components/Icon/collections.generated.ts。
 *
 * 这个脚本存在的理由，是一条**不报错的**缺陷：
 * `@iconify/react` 的规矩是「`addCollection` 注册过的名字走本地，没注册过的去
 * api.iconify.design 现拉」。本库在 46 处组件里写死了 iconify 图标名（Select 的下拉箭头
 * `ep:arrow-down`、Table 翻页、Copy、Tree 搜索、Chat……），却从不自己注册 —— 于是
 * **所有消费方默认都在替本库向公网发请求**。断网 / 内网 / CSP 收紧的环境里这些图标就是
 * 一片空白，而且控制台连个错都没有，只能靠肉眼发现。
 *
 * 文档站看不出来：.dumi/global.ts 把 30 个整集全 addCollection 了，所以本地怎么看都正常。
 * 这正是它能活到今天的原因。
 *
 * 修法：构建期把这 46 枚图标的矢量数据裁出来随产物走，由 Icon 组件在模块加载时注册。
 * 之后无论消费方怎么引（根入口 / 子路径 / 按需），本库自己的图标一律走本地、零请求。
 *
 * 为什么不手工维护这份子集：会漂。组件里改一枚图标名、手工子集不会自己跟上，
 * 结果又是「那一枚悄悄空白且不报错」—— 也就是本脚本要消灭的那个缺陷本身。
 *
 * 为什么不整集打进去：ph.json 单集 4.3 MB，全量注册等于把图标库塞进首屏。
 *
 * 用法：node scripts/gen-icon-data.cjs [--check]
 *   --check 只校验产物是否与源码一致（prepublishOnly 用），不写文件。
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const JSON_DIR = path.join(ROOT, "node_modules", "@iconify", "json", "json");
const OUT = path.join(ROOT, "src", "components", "Icon", "collections.generated.ts");

/** IconifyJSON 顶层可选的默认属性，不带上图标尺寸会错 */
const ROOT_KEYS = ["width", "height", "left", "top", "rotate", "hFlip", "vFlip"];

/**
 * 逐集的 viewBox 修正。
 *
 * `ant-design` 这套是从 @ant-design/icons-svg 转出来的，但**转丢了 viewBox 的偏移**：
 * antd 组件自己渲染时用 `viewBox="64 64 896 896"`，iconify 转出来的是
 * `0 0 1024 1024` —— 路径数据一模一样，画布却大了一圈。实测（文档站量 getBBox）：
 * 同一枚图标，antd 渲染墨迹占画布 89.3%，iconify 渲染只占 78.1%，
 * **同样的 font-size 下小了约 12.5%**，在表格操作列这种密集场景里肉眼看得出来。
 *
 * 所以这里把画布改回 antd 自己的那个。规则很好记：
 * **`ant-design:xxx` 渲染出来必须和同名的 antd 图标组件一模一样。**
 * 不这么修，本库里 `<Icon icon="ant-design:form-outlined" />` 和消费方自己写的
 * `<FormOutlined />` 摆在一起会差一号，属于说不清楚的那种别扭。
 */
const VIEWBOX_OVERRIDES = {
  "ant-design": { left: 64, top: 64, width: 896, height: 896 },
};

/**
 * 纯文本匹配 `"前缀:名字"` 字面量。
 *
 * 这一路**刻意不设前缀白名单** —— 库里用了哪些图标集是组件作者说了算，白名单列不全
 * 就会漏，漏掉的那枚又会悄悄走公网。改用更硬的判据：前缀确实是 @iconify/json 里的一个
 * 图标集，**且**名字在该集里真能解析出来（含 alias 链）。两条同时满足才算数，
 * 误收概率可以忽略（`"00:00"`、CSS 值、i18n key 这类都过不了第二条）。
 */
const ICON_NAME_RE =
  /["'`]([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)["'`]/g;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full, acc);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      // 产物自己不参与扫描，否则是自我循环
      if (full === OUT) continue;
      acc.push(full);
    }
  }
  return acc;
}

/** 按前缀懒加载整集并缓存 —— 单集动辄几 MB，用到哪套才读哪套 */
function makeSourceLoader() {
  const cache = new Map();
  return (prefix) => {
    if (cache.has(prefix)) return cache.get(prefix);
    const file = path.join(JSON_DIR, `${prefix}.json`);
    let source = null;
    if (fs.existsSync(file)) {
      try {
        source = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (err) {
        console.warn(`[gen:icons] ${prefix}.json 解析失败：${err.message}`);
      }
    }
    cache.set(prefix, source);
    return source;
  };
}

/** 把一枚图标（可能是 alias）连同它的 parent 链一起收进结果 */
function resolveIcon(source, target, name, seen = new Set()) {
  if (!source || seen.has(name)) return false; // seen 同时防 alias 成环
  seen.add(name);

  if (source.icons?.[name]) {
    target.icons[name] = source.icons[name];
    return true;
  }

  const alias = source.aliases?.[name];
  if (alias) {
    target.aliases = target.aliases || {};
    target.aliases[name] = alias;
    return alias.parent
      ? resolveIcon(source, target, alias.parent, seen)
      : true;
  }

  return false;
}

function build() {
  if (!fs.existsSync(JSON_DIR)) {
    console.error(
      `[gen:icons] 找不到 ${path.relative(ROOT, JSON_DIR)}，请先装依赖`
    );
    process.exit(1);
  }

  const loadSource = makeSourceLoader();
  const byPrefix = new Map();

  for (const file of walk(SRC_DIR)) {
    const code = fs.readFileSync(file, "utf8");
    let m;
    ICON_NAME_RE.lastIndex = 0;
    while ((m = ICON_NAME_RE.exec(code))) {
      const [, prefix, name] = m;
      const source = loadSource(prefix);
      if (!resolveIcon(source, { icons: {} }, name)) continue;
      if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Set());
      byPrefix.get(prefix).add(name);
    }
  }

  const collections = [];
  let total = 0;

  for (const prefix of [...byPrefix.keys()].sort()) {
    const source = loadSource(prefix);
    const subset = { prefix, icons: {} };
    for (const key of ROOT_KEYS) {
      if (source[key] !== undefined) subset[key] = source[key];
    }
    Object.assign(subset, VIEWBOX_OVERRIDES[prefix] ?? {});
    for (const name of [...byPrefix.get(prefix)].sort()) {
      resolveIcon(source, subset, name);
    }
    total += Object.keys(subset.icons).length;
    collections.push(subset);
  }

  const header = `// 本文件由 scripts/gen-icon-data.cjs 生成，请勿手改。
// 改图标请改组件里的图标名，然后跑 \`npm run icons\`（build / prepublishOnly 会自动跑）。
//
// 这是本库自己用到的 iconify 图标的**矢量数据子集**。Icon 组件在模块加载时把它注册进
// @iconify/react，好让本库的图标永远走本地、不向 api.iconify.design 发请求 ——
// 消费方在内网 / 断网环境下才不会看到一片空白图标（而且那种失败是不报错的）。
import type { IconifyJSON } from "@iconify/react";

`;

  // 不缩进：这份数据没人会去读，换行和空格只是白白进消费方的产物
  const body = `const collections: IconifyJSON[] = ${JSON.stringify(collections)};

export default collections;
`;

  return { output: header + body, total, sets: collections.length };
}

const { output, total, sets } = build();

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== output) {
    console.error(
      `[gen:icons] ${path.relative(ROOT, OUT)} 与源码不一致，请跑 \`npm run icons\` 后提交`
    );
    process.exit(1);
  }
  console.log(`[gen:icons] 校验通过（${total} 枚 / ${sets} 套）`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, output);
  console.log(
    `[gen:icons] 已生成 ${path.relative(ROOT, OUT)}：${total} 枚 / ${sets} 套`
  );
}
