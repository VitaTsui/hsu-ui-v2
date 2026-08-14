#!/usr/bin/env node
/**
 * 从 src/styles/tokens.json 生成 src/styles/tokens.scss。
 *
 * 为什么要生成、而不是两边各写一份：
 * antd 的 theme.token 只能吃真实颜色值（colorPrimary 要经 @ant-design/colors 派生 10 级色板，
 * 传 `var(--vita-primary)` 会让派生整个崩掉），所以 JS 侧必须有一份字面量。而组件样式又得用
 * CSS 变量才能在运行时跟随明暗切换。两份值一旦手写就必然漂——旧版 tokens.ts 与 tokens.scss
 * 文件头就写着「the two must be kept in sync」，那句话本身就是问题的证据。
 *
 * 现在 tokens.json 是唯一真源：这个脚本产出 CSS 变量层，src/styles/tokens.ts 产出 antd token 层。
 *
 * 用法：node scripts/gen-tokens-scss.cjs [--check]
 *   --check 只校验产物是否与真源一致（CI / prepublish 用），不写文件。
 */

const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../src/styles/tokens.json");
const OUT = path.resolve(__dirname, "../src/styles/tokens.scss");
const OUT_RESPONSIVE = path.resolve(__dirname, "../src/styles/_responsive.scss");

const tokens = JSON.parse(fs.readFileSync(SRC, "utf8"));

/** 主题相关变量：随明暗两套值切换 */
const THEMED = [
  ["background", "background", "页面画布"],
  ["surface", "surface", "卡片 / 面板背景"],
  ["muted", "muted", "次级背景（表头、只读区）"],
  ["border", "border", "边框"],
  ["border-weak", "borderWeak", "更浅的分隔线"],
  ["foreground", "foreground", "主文字"],
  ["muted-foreground", "mutedForeground", "次级文字"],
  ["subtle-foreground", "subtleForeground", "占位 / 禁用文字"],
  ["hover", "hover", "行 / 项 hover 背景"],
  ["success", "success", ""],
  ["warning", "warning", ""],
  ["error", "error", ""],
  ["shadow-1", "shadow1", "浮层阴影 - 弱"],
  ["shadow-2", "shadow2", "浮层阴影 - 中"],
  ["shadow-3", "shadow3", "浮层阴影 - 强"],
];

/**
 * 旧变量名 -> 新变量名。2.0 之前的 --cf-* 全部保留为单向别名，
 * 消费方项目里既有的覆盖不会一夜失效。
 */
const LEGACY = [
  ["--cf-canvas", "--vita-background"],
  ["--cf-surface", "--vita-surface"],
  ["--cf-subtle", "--vita-muted"],
  ["--cf-border", "--vita-border"],
  ["--cf-border-weak", "--vita-border-weak"],
  ["--cf-text", "--vita-foreground"],
  ["--cf-text-2", "--vita-muted-foreground"],
  ["--cf-text-3", "--vita-subtle-foreground"],
  ["--cf-row-hover", "--vita-hover"],
  ["--cf-success", "--vita-success"],
  ["--cf-warning", "--vita-warning"],
  ["--cf-error", "--vita-error"],
  ["--cf-font-family", "--vita-font-family"],
  ["--cf-font-size-sm", "--vita-font-size-sm"],
  ["--cf-font-size", "--vita-font-size"],
  ["--cf-font-size-lg", "--vita-font-size-lg"],
  ["--cf-radius-sm", "--vita-radius-sm"],
  ["--cf-radius", "--vita-radius"],
  ["--cf-radius-lg", "--vita-radius-lg"],
  ["--cf-shadow-1", "--vita-shadow-1"],
  ["--cf-shadow-2", "--vita-shadow-2"],
  ["--cf-shadow-3", "--vita-shadow-3"],
];

const decl = (name, value, comment) =>
  `  --vita-${name}: ${value};${comment ? ` // ${comment}` : ""}`;

const lines = [];
lines.push("// =============================================================");
lines.push("// 本文件由 scripts/gen-tokens-scss.cjs 从 src/styles/tokens.json 生成，请勿手改。");
lines.push("// 改令牌请改 tokens.json，然后跑 `pnpm tokens`（build / prepublish 会自动跑并校验）。");
lines.push("//");
lines.push("// 暗色由 html[data-theme=\"dark\"] 激活（消费方主题开关），");
lines.push("// 或 html[data-prefers-color(-scheme)=\"dark\"]（dumi 文档站）。");
lines.push("// =============================================================");
lines.push("");
lines.push(":root {");
lines.push("  // ---- 品牌色 ----");
lines.push("  // 兼容位：2.0 之前消费方就是通过覆盖 --primary-color 换主题色的，");
lines.push("  // 所以真源反过来引用它，两种写法都生效。");
lines.push(`  --primary-color: ${tokens.primary};`);
lines.push("  --vita-primary: var(--primary-color);");
lines.push("  --vita-primary-foreground: #ffffff;");
lines.push("  // focus ring：shadcn 的 2px 环。收成令牌之前各组件各写各的透明度");
lines.push("  // （6% / 10% / 12% / 20% 都出现过），聚焦态在不同控件上深浅不一。");
lines.push(
  "  --vita-ring: color-mix(in srgb, var(--vita-primary) 35%, transparent);"
);
lines.push(
  "  --vita-ring-error: color-mix(in srgb, var(--vita-error) 30%, transparent);"
);
lines.push(`  --vita-ring-width: ${tokens.control.ringWidth}px;`);
lines.push(
  "  --vita-focus-ring: 0 0 0 var(--vita-ring-width) var(--vita-ring);"
);
lines.push(
  "  --vita-focus-ring-error: 0 0 0 var(--vita-ring-width) var(--vita-ring-error);"
);
lines.push("");
lines.push("  // ---- 中性色（浅色）----");
for (const [name, key, comment] of THEMED) {
  lines.push(decl(name, tokens.light[key], comment));
}
lines.push("");
lines.push("  // ---- 字体 ----");
lines.push(`  --vita-font-family: ${tokens.font.family};`);
lines.push(`  --vita-font-size-sm: ${tokens.font.sizeSm}px;`);
lines.push(`  --vita-font-size: ${tokens.font.size}px;`);
lines.push(`  --vita-font-size-lg: ${tokens.font.sizeLg}px;`);
lines.push("");
lines.push("  // ---- 圆角 ----");
lines.push(`  --vita-radius-xs: ${tokens.radius.xs}px;`);
lines.push(`  --vita-radius-sm: ${tokens.radius.sm}px;`);
lines.push(`  --vita-radius: ${tokens.radius.base}px;`);
lines.push(`  --vita-radius-lg: ${tokens.radius.lg}px;`);
lines.push("");
lines.push("  // ---- 控件高度 ----");
lines.push(`  --vita-control-height: ${tokens.control.height}px;`);
lines.push(`  --vita-control-height-sm: ${tokens.control.heightSm}px;`);
lines.push(`  --vita-control-height-lg: ${tokens.control.heightLg}px;`);
lines.push("");
lines.push("  // ---- 断点（媒体查询用不了 CSS 变量，这里只是让 JS 侧与文档能读到同一份值；");
lines.push("  //      真正的断点判断走 styles/_responsive.scss 的 mixin 或 useBreakpoint）----");
for (const [name, value] of Object.entries(tokens.breakpoint)) {
  lines.push(`  --vita-screen-${name}: ${value}px;`);
}
lines.push("");
lines.push("  // ---- 兼容别名（2.0 前的 --cf-*，单向指向新名）----");
for (const [oldName, newName] of LEGACY) {
  lines.push(`  ${oldName}: var(${newName});`);
}
lines.push("}");
lines.push("");
lines.push('html[data-theme="dark"],');
lines.push('html[data-prefers-color="dark"],');
lines.push('html[data-prefers-color-scheme="dark"] {');
for (const [name, key] of THEMED) {
  lines.push(`  --vita-${name}: ${tokens.dark[key]};`);
}
lines.push("}");
lines.push("");

const output = lines.join("\n");

// ---------------------------------------------------------------------------
// _responsive.scss：断点与指针类型的 mixin
//
// 媒体查询的条件部分不能用 CSS 变量（`@media (max-width: var(--x))` 无效），所以断点必须
// 以字面量进入 CSS。为了不让它变成第二份真源，这里同样由 tokens.json 生成。
// ---------------------------------------------------------------------------
const bp = tokens.breakpoint;
const rLines = [];
rLines.push("// =============================================================");
rLines.push("// 本文件由 scripts/gen-tokens-scss.cjs 从 src/styles/tokens.json 生成，请勿手改。");
rLines.push("//");
rLines.push("// 用法：");
rLines.push("//   @use \"../../styles/responsive\" as r;");
rLines.push("//   .panel { padding: 24px; @include r.down(md) { padding: 12px; } }");
rLines.push("//   .row   { &:hover { background: …; } }  // 触屏上 hover 会「粘住」");
rLines.push("//   .row   { @include r.hover { &:hover { background: …; } } }  // 正确写法");
rLines.push("// =============================================================");
rLines.push("");
// map-has-key / map-get / map-keys 这几个全局函数在 Dart Sass 3.0 会被移除，现在用会
// 打弃用告警（消费方每编译一个引了本文件的 module.scss 就打一条，实测刷了 10 条）。
// 改用 sass:map 模块的同名成员。
rLines.push("@use \"sass:map\";");
rLines.push("");
rLines.push("$breakpoints: (");
for (const [name, value] of Object.entries(bp)) {
  rLines.push(`  ${name}: ${value}px,`);
}
rLines.push(");");
rLines.push("");
rLines.push("@function bp($name) {");
rLines.push("  @if not map.has-key($breakpoints, $name) {");
rLines.push("    @error \"未知断点 #{$name}，可用：#{map.keys($breakpoints)}\";");
rLines.push("  }");
rLines.push("  @return map.get($breakpoints, $name);");
rLines.push("}");
rLines.push("");
rLines.push("/// 视口 < 断点（移动优先的「小屏覆盖」）");
rLines.push("@mixin down($name) {");
rLines.push("  @media (max-width: #{bp($name) - 0.02px}) {");
rLines.push("    @content;");
rLines.push("  }");
rLines.push("}");
rLines.push("");
rLines.push("/// 视口 >= 断点");
rLines.push("@mixin up($name) {");
rLines.push("  @media (min-width: #{bp($name)}) {");
rLines.push("    @content;");
rLines.push("  }");
rLines.push("}");
rLines.push("");
rLines.push("/// 真正有悬停能力的设备（鼠标 / 触控板）。");
rLines.push("/// 触屏上 :hover 会在点击后「粘住」，直到点别处才消失 —— 所有 hover 态都该包在这里。");
rLines.push("@mixin hover {");
rLines.push("  @media (hover: hover) and (pointer: fine) {");
rLines.push("    @content;");
rLines.push("  }");
rLines.push("}");
rLines.push("");
rLines.push("/// 触摸设备（粗指针、无悬停）。用于放大点按目标、去掉仅悬停可见的操作。");
rLines.push("@mixin touch {");
rLines.push("  @media (hover: none), (pointer: coarse) {");
rLines.push("    @content;");
rLines.push("  }");
rLines.push("}");
rLines.push("");
const responsiveOutput = rLines.join("\n");

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  const currentR = fs.existsSync(OUT_RESPONSIVE)
    ? fs.readFileSync(OUT_RESPONSIVE, "utf8")
    : "";
  if (current !== output || currentR !== responsiveOutput) {
    console.error(
      "✗ tokens：src/styles/tokens.scss 与 tokens.json 不一致，请运行 `pnpm tokens` 后重新提交"
    );
    process.exit(1);
  }
  console.log("✓ tokens：tokens.scss 与真源一致");
} else {
  fs.writeFileSync(OUT, output);
  fs.writeFileSync(OUT_RESPONSIVE, responsiveOutput);
  console.log(
    `✓ tokens：已生成 tokens.scss（${THEMED.length} 个主题变量 + ${LEGACY.length} 个兼容别名）` +
      ` 与 _responsive.scss（${Object.keys(bp).length} 个断点）`
  );
}
