import { defineConfig } from "dumi";

// GitHub Pages 项目站点路径为 /hsu-ui/；本地开发(yarn dev)仍用根路径。
const isGhPages = !!process.env.GH_PAGES;
const base = isGhPages ? "/hsu-ui/" : "/";

export default defineConfig({
  base,
  publicPath: base,
  themeConfig: {
    name: "Hsu UI",
    logo: `${base}logo.svg`,
    nav: [
      { title: "指南", link: "/guide" },
      { title: "组件", link: "/components/button" },
      { title: "布局", link: "/layouts/header" },
    ],
    footer: "Hsu UI · 基于 React + Ant Design 的中后台组件库",
    socialLinks: {
      github: "https://github.com/VitaTsui",
    },
  },
  styles: [],
  // dumi(umi) 内置 sass-loader，安装 sass 后原生支持 scss，无需额外配置
  resolve: {
    docDirs: ["docs"],
    atomDirs: [
      { type: "component", dir: "src/components" },
      { type: "layout", dir: "src/layout" },
    ],
  },
  // 仅作文档站，不输出库（库由 father 构建）
  mfsu: false,
});
