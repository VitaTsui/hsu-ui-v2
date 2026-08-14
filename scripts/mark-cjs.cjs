/**
 * 在 lib/ 下写一个 `{"type":"commonjs"}` 的 package.json。
 *
 * 包根声明了 `"type": "module"`（es/ 是 ESM 产物），Node 会据此把**整个包**里的 `.js`
 * 都按 ESM 解析——包括 father 输出到 lib/ 的 CJS。结果是 `exports.foo = ...` 这类赋值
 * 落到一个不存在的 `exports` 上，`require("@hsu-react/ui/lib/xxx")` 拿到的是**空对象**，
 * 而且不报错。
 *
 * 实测踩到：新增的 lib/build/webpack.js 里 `exports.excludeNodeModulesExceptHsuUi`
 * 明明在，require 回来却是 undefined。
 *
 * 目录级的 package.json 只影响该目录子树，是 Node 官方给双产物包用的办法。
 */
const fs = require("fs");
const path = require("path");

const target = path.resolve(__dirname, "../lib/package.json");
if (!fs.existsSync(path.dirname(target))) {
  console.log("✗ mark-cjs：lib/ 不存在，跳过（先跑 build）");
  process.exit(0);
}

fs.writeFileSync(target, JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
console.log("✓ mark-cjs：已标记 lib/ 为 CommonJS");
