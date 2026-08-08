#!/usr/bin/env node
/**
 * 构建前清空 es/ 与 lib/。
 *
 * father 是增量写入、不清目录的：源码里删掉一个组件后，它的旧产物会一直留在 es/ 与 lib/ 里。
 * 而 package.json 的 files 字段包含 es 与 lib，于是这些"幽灵文件"会被打进 npm 包 —— 消费方
 * 仍能 import 到一个早已删除的模块。0.1.0 删掉 BasicButton 时就实测复现了这个现象。
 */
const fs = require("fs");
const path = require("path");

for (const dir of ["es", "lib"]) {
  const p = path.resolve(__dirname, "..", dir);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`✓ clean：已清空 ${dir}/`);
  }
}
