#!/usr/bin/env node
/**
 * 生成 src/components/Icon/antdIcons.generated.ts —— 846 枚 antd 图标的**逐枚**懒加载表。
 *
 * 这份表存在的理由，是一条「看着已经修好、其实一点没修」的缺陷：
 *
 * `Icon` 支持消费方传 antd 图标名（`<Icon icon="UserOutlined" />`），名字是运行时才
 * 知道的字符串，所以实现上只能按下标取。2.5.10 之前写的是 `import * as AntdIcons`，
 * 整包 846 枚进每个消费方的首屏（约 198 KB gzip）。2.5.11 改成了
 * `import("@ant-design/icons")` —— 看上去是「按需」了，实测也确实从首屏挪走了，
 * **但整页流量一个字节没省**：
 *
 *   `import()` 要的是**整个包根模块的命名空间**，打包器因此必须把 `es/index.js`
 *   连同它 `export *` 出来的 846 枚全部保留成一个 chunk。而 `@ant-design/icons`
 *   的包根**同时被静态引用**着 —— 本库依赖的 `@ant-design/x` 就有 27 处
 *   `import { XxxOutlined } from "@ant-design/icons"`。静态引用与动态引用落在同一个
 *   模块上，那个 1 MB 的 chunk 就成了**静态依赖**：谁引到 Chat/Sender 谁就下载它，
 *   跟有没有传过 antd 图标名毫无关系。
 *
 *   实测（消费方 agent-monitor-web，Vite 8 / rolldown）：首屏 HTML 里确实没有它，
 *   但 portal 加载完之后仍有一次 203 KB 的 `script` 发起的下载。把本库这句 `import()`
 *   去掉重新构建，那个 1,018,635 字节的 chunk **整个消失** —— 根因就是这一句。
 *
 * 所以「按需」必须落到**单枚图标**这一级：每枚一句固定字符串的 `import()`，
 * 打包器为它们各切一个几百字节的 chunk，只有真被传到的那一枚才会下载；
 * 本表自身也藏在一次 `import()` 后面，一个 antd 名字都不传的消费方零字节、零请求。
 *
 * 公开 API 一个字没动：还是传字符串名、还是这 846 个名字都认。
 *
 * 用法：node scripts/gen-antd-icon-loaders.cjs [--check]
 *   --check 只校验产物是否与 @ant-design/icons 当前版本一致（prepublishOnly 用），不写文件。
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ICONS_INDEX = path.join(
  ROOT,
  "node_modules",
  "@ant-design",
  "icons",
  "es",
  "icons",
  "index.js"
);
const OUT = path.join(
  ROOT,
  "src",
  "components",
  "Icon",
  "antdIcons.generated.ts"
);

/**
 * 图标名从 `@ant-design/icons/es/icons/index.js` 的再导出列表里读，不是扫目录。
 *
 * 目录里还躺着 `index.js` 与一堆 `.d.ts`，而这份 index 就是这个包对外承认的图标全集 ——
 * 包升级时多一枚少一枚，跟着它走就不会漂。
 */
const readIconNames = () => {
  if (!fs.existsSync(ICONS_INDEX)) {
    console.error(
      `[gen:antd-icons] 找不到 ${path.relative(ROOT, ICONS_INDEX)}，先装好 @ant-design/icons`
    );
    process.exit(1);
  }

  const source = fs.readFileSync(ICONS_INDEX, "utf8");
  const names = [];
  const re = /export\s*\{\s*default\s+as\s+([A-Za-z0-9_$]+)\s*\}\s*from\s*"\.\/([A-Za-z0-9_$]+)"/g;

  let match;
  while ((match = re.exec(source))) {
    // 导出名与文件名必须一致，否则下面拼出来的路径是错的（antd 自己的生成器保证一致，
    // 这里只是不让「哪天不一致了」变成一条运行时才发现的空白图标）
    if (match[1] !== match[2]) {
      console.error(
        `[gen:antd-icons] 导出名 ${match[1]} 与文件名 ${match[2]} 不一致，脚本需要跟进`
      );
      process.exit(1);
    }
    names.push(match[1]);
  }

  if (!names.length) {
    console.error("[gen:antd-icons] 没解析出任何图标名，@ant-design/icons 的产物格式变了");
    process.exit(1);
  }

  return names.sort();
};

const build = () => {
  const names = readIconNames();

  const header = `// 本文件由 scripts/gen-antd-icon-loaders.cjs 生成，请勿手改。
// @ant-design/icons 升级后跑 \`npm run icons\`（build / prepublishOnly 会自动跑）。
//
// 每枚 antd 图标一句固定字符串的 import()，打包器据此为每枚各切一个几百字节的 chunk。
// **不要**改回从 "@ant-design/icons" 包根取：包根被 @ant-design/x 等库静态引用着，
// 一旦本库也去引它，那 846 枚就会被整体保留成一个静态可达的 chunk，
// 「按需」立刻退化成「每个消费方都下载 200 KB」（这正是 2.5.11 踩过的坑）。
import type React from "react";

/** antd 具名图标组件（\`UserOutlined\` 这类）的最小签名，只用到这几个 prop */
export type AntdNamedIconComponent = React.ForwardRefExoticComponent<
  {
    className?: string;
    style?: React.CSSProperties;
  } & React.RefAttributes<HTMLSpanElement>
>;

export type AntdIconLoader = () => Promise<{ default: AntdNamedIconComponent }>;

`;

  // 不缩进、不换行地堆：这份表没人会去读，多余的空白只是白白进消费方的产物
  const entries = names
    .map((name) => `${name}:()=>import("@ant-design/icons/es/icons/${name}"),`)
    .join("\n");

  const body = `const antdIconLoaders: Record<string, AntdIconLoader> = {
${entries}
};

export default antdIconLoaders;
`;

  return { output: header + body, total: names.length };
};

const { output, total } = build();

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== output) {
    console.error(
      `[gen:antd-icons] ${path.relative(ROOT, OUT)} 与 @ant-design/icons 不一致，请跑 \`npm run icons\` 后提交`
    );
    process.exit(1);
  }
  console.log(`[gen:antd-icons] 校验通过（${total} 枚）`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, output);
  console.log(
    `[gen:antd-icons] 已生成 ${path.relative(ROOT, OUT)}：${total} 枚`
  );
}
