#!/usr/bin/env node
/**
 * 构建产物守卫：禁止「几乎每个页面都会引入的入口」静态可达重型三方库。
 *
 * 背景：FormItem 是个静态分发器，业务侧只要用到任何一种表单项就会引入它。它曾经
 * 静态 import 了全部字段渲染器，于是 @wangeditor / @codemirror / zxcvbn 会被一并
 * 打进消费方首屏——某后台项目实测因此多背约 787 KB（gzip）。
 *
 * 这类回归**没有任何信号**：不报错、不慢一点点，只是所有消费方的首屏悄悄变大，
 * 往往几个月后才被发现。所以在 prepublishOnly 里卡住：谁再静态引，就发不出版。
 *
 * 检查方式是沿 es/ 产物的**静态** import 图做 BFS（动态 import() 不算，那正是我们
 * 希望的形态），命中黑名单即失败，并打印完整引用链，便于定位是哪一跳引进来的。
 *
 * 已知局限：只遍历本仓库 es/ 内的相对引用，**不穿透三方包**。例如 PdfPreview 是经
 * `hsu-utils` 的 RenderPDF 间接依赖 pdfjs-dist 的，这里看不见——而 hsu-utils 是通用
 * 工具包、不能整包拉黑。这类间接引入的兜底手段是消费方侧量首屏体积。
 */

const fs = require("fs");
const path = require("path");

const ES_DIR = path.resolve(__dirname, "../es");

/** 入口：这些模块被业务侧广泛引入，它们的静态依赖会进消费方首屏 */
const GUARDED_ENTRIES = [
  "components/FormItem/index.js",
  // Panel.List 会经 Search 用到 FormItem，同属高频入口
  "components/Panel/index.js",
  // 全库最基础的组件，页面/弹窗/工具栏无处不引。0.0.23 时 Button.Chakra 曾把 chakra 全家
  // （chakra-ui + zag-js + floating-ui + emotion，实测约 560 KB）带进每个首屏；2.0 起
  // 按钮改为自研、chakra 已整体移除，但这个入口的高频属性没变，守卫继续保留
  "components/Button/index.js",
];

// 说明：根 barrel（index.js）刻意**不**列为守卫入口。它对每个组件都是一句
// `export { default as X } from "./components/X"`，属于可被 tree-shaking 摇掉的再导出，
// 与 FormItem 那种「运行时按 type 分发、必然全部求值」的入口性质不同 —— 把它列进来会把
// CodeMirror / Editor 这些正常的再导出误判成违规。
//
// 真正需要守的是「不装就构建失败」的可选 peer（react-router / react-intl）：它们已在下面
// 的黑名单里，且布局组件不从根 barrel 导出，因此不会被任何一个高频入口静态触达。

/**
 * 重型三方库黑名单。这些包体积大且只服务于特定组件，必须走动态 import()
 * 或由消费方自行深路径引入，不得从高频入口静态可达。
 */
const HEAVY = [
  "@wangeditor/editor",
  "@wangeditor/editor-for-react",
  "@codemirror/",
  "@uiw/react-codemirror",
  "zxcvbn",
  "xlsx",
  "x-data-spreadsheet",
  "pdfjs-dist",
  "echarts",
  "echarts-gl",
  "@antv/g6",
  "mermaid",
  "katex",
  "node-sql-parser",
  "mongodb-query-parser",
  // 图标集数据（四套约 1.9 MB）。注意只拉黑数据包 @iconify/json，
  // 渲染用的 @iconify/react 很小且被 Icon 组件正常静态引入
  "@iconify/json",
  // 2.0 起已不是依赖（按钮改自研）；留在黑名单里作为回归护栏，防止有人再引回来
  "@chakra-ui/react",
  // 布局组件专用，且是**可选** peerDependency。它们一旦从高频入口静态可达，没装
  // react-router 的项目连 import Button 都会构建失败 —— 可选就失去意义了。
  // 布局请走子路径：import Layout from "@hsu-react/ui/es/layout"
  "react-router",
  "react-intl",
];

/** 从 babel 产物里抽静态 import 的模块说明符（刻意不匹配动态 import(...)） */
function staticImportsOf(file) {
  const code = fs.readFileSync(file, "utf8");
  const specs = [];
  // import x from "m" / import { a } from "m" / import "m"
  const re = /^\s*import\s+(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/gm;
  let m;
  while ((m = re.exec(code))) specs.push(m[1]);
  // export { x } from "m" —— 同样是静态依赖
  const re2 = /^\s*export\s+(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/gm;
  while ((m = re2.exec(code))) specs.push(m[1]);
  return specs;
}

/** 把相对说明符解析成 es/ 下的真实文件；解析不到返回 null（如 .scss） */
function resolveLocal(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.js`,
    path.join(base, "index.js"),
    `${base}.jsx`,
  ];
  return candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) ?? null;
}

const violations = [];

for (const entry of GUARDED_ENTRIES) {
  const entryFile = path.join(ES_DIR, entry);
  if (!fs.existsSync(entryFile)) {
    console.error(`[check-heavy-deps] 找不到入口产物：${entryFile}（先跑 father build）`);
    process.exit(1);
  }

  // BFS，记录引用链
  const seen = new Set([entryFile]);
  const queue = [[entryFile, [entry]]];

  while (queue.length) {
    const [file, chain] = queue.shift();
    for (const spec of staticImportsOf(file)) {
      const heavy = HEAVY.find((h) => spec === h || spec.startsWith(h));
      if (heavy) {
        violations.push({ entry, chain: [...chain, spec], pkg: heavy });
        continue;
      }
      const next = resolveLocal(file, spec);
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push([next, [...chain, path.relative(ES_DIR, next)]]);
      }
    }
  }
}

if (violations.length) {
  console.error("\n✗ 高频入口静态可达重型依赖，这会让所有消费方的首屏变大：\n");
  for (const v of violations) {
    console.error(`  【${v.pkg}】`);
    console.error(`    ${v.chain.join("\n      → ")}\n`);
  }
  console.error(
    "修法：把引入该依赖的那个渲染器改成 React.lazy(() => import(...))，\n" +
      "或把依赖本身改成在用到的那一刻动态 import()。参考 FormItem 里 FormEditor /\n" +
      "FormCodeMirror 与 FormPasswordStrength 中 zxcvbn 的写法。\n"
  );
  process.exit(1);
}

console.log(
  `✓ check-heavy-deps：${GUARDED_ENTRIES.length} 个高频入口均未静态可达重型依赖`
);

/* ------------------------------------------------------------------ *
 * 第二道：`@ant-design/icons` 只准按单枚深引，不准碰包根 barrel
 * ------------------------------------------------------------------ */

/**
 * 这条单独列出来，是因为上面那道 BFS 守卫**看不见它**：它只跟 es/ 内部的相对引用，
 * 不穿透三方包，而这个坑恰恰藏在三方包里。
 *
 * 坑长这样：`@ant-design/icons` 的包根 barrel（`es/index.js`）被本库依赖的
 * `@ant-design/x` 静态引用着（27 处 `import { XxxOutlined } from "@ant-design/icons"`）。
 * 本库只要也去引一次那个 barrel —— **静态引是 `import * as`，动态引是 `import()`，
 * 两种一样糟** —— 打包器就必须把 barrel 连同 846 枚图标整体保留成一个 chunk，
 * 而它同时又是静态可达的，于是每个消费方都要下载那约 200 KB gzip。
 * 2.5.10 踩的是第一种，2.5.11 改成第二种、以为修好了，实测整页流量一个字节没省。
 *
 * 唯一安全的形态是单枚深引：`@ant-design/icons/es/icons/UserOutlined`。
 * 按名字分发的那张表由 scripts/gen-antd-icon-loaders.cjs 生成。
 */
const ICON_PKG = "@ant-design/icons";
const SINGLE_ICON = /^@ant-design\/icons\/(es|lib)\/icons\/[A-Z][A-Za-z0-9]*$/;

/**
 * 去掉注释再扫。
 *
 * 不去的话这道守卫会**咬到解释它自己的那段注释** —— Icon 组件里写着
 * 「2.5.11 的 `import("@ant-design/icons")` 错在哪」，正则一视同仁地把它算成一次引用，
 * 于是「写清楚为什么不能这么干」反而导致构建失败。
 *
 * 只按字符走一遍：字符串（含模板串）里的内容原样留着，`//` 与 `/* *\/` 抹掉。
 * `/` 只有后面跟着 `/` 或 `*` 才算注释开头，所以 `/(?:Outlined)$/` 这种正则字面量不会被误伤。
 */
function stripComments(code) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < code.length) {
    const c = code[i];
    const next = code[i + 1];
    if (quote) {
      if (c === "\\") {
        out += c + (next ?? "");
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      out += c;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < code.length && code[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/** 抽出文件里所有模块说明符，**静态动态都要**（这条规则两种形态都禁） */
function allSpecifiersOf(file) {
  const code = stripComments(fs.readFileSync(file, "utf8"));
  const specs = [];
  const re =
    /(?:^\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']/gm;
  let m;
  while ((m = re.exec(code))) specs.push(m[1]);
  return specs;
}

function walkJs(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkJs(full, out);
    else if (full.endsWith(".js")) out.push(full);
  }
  return out;
}

const barrelHits = [];
for (const file of walkJs(ES_DIR)) {
  for (const spec of allSpecifiersOf(file)) {
    if (spec !== ICON_PKG && !spec.startsWith(`${ICON_PKG}/`)) continue;
    if (SINGLE_ICON.test(spec)) continue;
    barrelHits.push({ file: path.relative(ES_DIR, file), spec });
  }
}

if (barrelHits.length) {
  console.error(
    "\n✗ 引用了 @ant-design/icons 的包根 barrel —— 所有消费方会因此白背约 200 KB gzip：\n"
  );
  for (const h of barrelHits) console.error(`  es/${h.file}  →  "${h.spec}"`);
  console.error(
    "\n包根被 @ant-design/x 静态引用着，本库再引一次（import * as 或 import() 都算）\n" +
      "就会让那 846 枚被整体保留成一个静态可达的 chunk。改成单枚深引：\n" +
      '  import("@ant-design/icons/es/icons/UserOutlined")\n' +
      "按名字分发请用 src/components/Icon/antdIcons.generated.ts（npm run icons 生成）。\n"
  );
  process.exit(1);
}

console.log("✓ check-heavy-deps：@ant-design/icons 全部按单枚深引，未碰包根 barrel");
