import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 防回归守卫：**滚动条占位不许吃掉侧栏菜单项的内缩**。
 *
 * 缺陷长什么样：菜单根自己是滚动容器，滚动条一实占宽度就从它的内容盒里切走一条，
 * 而菜单项的左右外边距量的正是这个内容盒 —— 展开子菜单让菜单超高、滚动条出现，
 * 右留白从 10px 跳到 24px、左留白仍是 8px，看着就是「展开的那一项右边距变大了」。
 *
 * 正解是 `scrollbar-gutter: stable both-edges`（两侧对称、恒定保留，槽宽由浏览器按
 * 实际滚动条算），并把菜单项自己的左右外边距清零，让留白只由这条槽提供。
 *
 * 这条守卫只能扫源码：jsdom 不做布局，量不出滚动条占位。所以顺带把两种「硬拉回来」
 * 的写法也钉死 —— 写死滚动条宽度、或者用负 margin 把内容顶回去，换台机器就错开。
 */

const SCSS = fs.readFileSync(
  path.resolve(__dirname, "index.module.scss"),
  "utf8"
);

describe("侧栏菜单的滚动条占位", () => {
  it("inline 菜单两侧对称保留滚动条槽", () => {
    // 要的是**声明**本身，不是 @supports 条件里那份同名文本
    expect(SCSS).toMatch(/scrollbar-gutter:\s*stable both-edges\s*;/);
    // 槽由 @supports 兜底，不认这个属性的浏览器维持原样
    expect(SCSS).toMatch(/@supports \(scrollbar-gutter: stable both-edges\)/);
  });

  it("菜单项不再自己留左右外边距 —— 留白只由那条槽提供，不叠加", () => {
    expect(SCSS).toMatch(/margin-inline:\s*0px/);
  });

  it("不许写死滚动条宽度，也不许用负 margin 硬拉回来", () => {
    // 滚动条宽度按平台 / 用户设置变，写死会在别的机器上错开
    expect(SCSS).not.toMatch(/(?:width|margin|padding)[^;{}]*:\s*-?1[45]px/);
    expect(SCSS).not.toMatch(/margin[a-z-]*:\s*[^;{}]*-\d/);
  });

  it("横向一律不滚、子菜单自己不滚 —— 上一轮修「闪滚动条」的口径没被冲掉", () => {
    expect(SCSS).toMatch(/overflow-x:\s*hidden/);
    expect(SCSS).toMatch(/\.ant-menu-sub\.ant-menu-inline\)\s*\{\s*overflow:\s*hidden/);
  });

  it("不许在库里写 scrollbar-width / scrollbar-color —— Chrome 会整套忽略消费方的 ::-webkit-scrollbar", () => {
    expect(SCSS).not.toMatch(/^\s*scrollbar-(?:width|color)\s*:/m);
  });
});
