/**
 * 给消费方 webpack 配置用的工具。**构建期模块，不要从应用代码里引**
 * —— 它不依赖 React，也不该进运行时产物。
 *
 * ```js
 * // webpack.config.js（CJS）
 * const { excludeNodeModulesExceptHsuUi } = require("@hsu-react/ui/lib/build/webpack");
 *
 * { test: /\.scss$/, exclude: excludeNodeModulesExceptHsuUi, use: [...] }
 * ```
 */

/**
 * 判断一个模块路径「是否该被 loader 排除」：node_modules 一律排除，但放行本库。
 *
 * ## 为什么需要它
 *
 * 本库的 es / lib 产物里带着**未编译的 `.module.scss`** 和图片资源，要由消费方自己的
 * loader 处理（这样 CSS Module 的类名哈希、`getLocalIdent` 等策略才由消费方说了算）。
 * 于是每个 webpack 项目都得在 scss / 图片规则上开一个「排除 node_modules，但放行
 * @hsu-react/ui」的例外。
 *
 * ## 为什么不能用正则
 *
 * 手写的版本几乎都是 `/node_modules\/(?!@hsu-react\/ui\/)/`。它只看**第一个**
 * node_modules 后面跟着什么——扁平安装（yarn / npm）下确实是 `@hsu-react/ui/`，
 * 但 pnpm 的真实路径是
 *
 * ```
 * node_modules/.pnpm/@hsu-react+ui@<版本>/node_modules/@hsu-react/ui/es/...
 * ```
 *
 * 跟着的是 `.pnpm/`，否定前瞻立刻失败，本库的 scss 与图片会被**全部排除**，
 * 报「no loaders are configured to process this file」。这个坑在四个下游项目里
 * 各踩过一次，所以把判定收进库里导出，消费方引用而不是各抄一份。
 *
 * 改按「整条路径里有没有 @hsu-react/ui」判断，扁平与嵌套两种布局都成立；
 * 路径分隔符同时接受 `/` 与 `\`，Windows 下同样有效。
 */
export const excludeNodeModulesExceptHsuUi = (modulePath: string): boolean =>
  /node_modules/.test(modulePath) &&
  !/@hsu-react[\\/]ui[\\/]/.test(modulePath);

export default excludeNodeModulesExceptHsuUi;
