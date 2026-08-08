import React, { useEffect, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

import { configureRequest } from "../src/request";

// 文档站运行时（umi rootContainer）：与真实项目入口一致，只挂 antd 的 ConfigProvider。
// 0.1.0 起按钮改为自研（Button.Basic），chakra 与 emotion cache 已整体移除，这里不再需要
// 任何额外 Provider。

// 给依赖 request 的智能组件（如 ImportForm 下载模板）注入 Demo 用的假请求，避免未注入报错。
configureRequest({
  get: async () => ({
    code: 0,
    data: { filename: "demo", data: new ArrayBuffer(0) },
  }),
  post: async () => ({ code: 0, data: undefined }),
  del: async () => ({ code: 0, data: undefined }),
  put: async () => ({ code: 0, data: undefined }),
});

// dumi 的主题开关只翻转 html[data-prefers-color]，antd 组件的暗色需要 darkAlgorithm 配合；
// 监听该属性（auto 时回退系统偏好），让所有 Demo 里的 antd 内部控件与 token 层一起切换。
const readDark = () => {
  if (typeof document === "undefined") return false;
  const prefers = document.documentElement.getAttribute("data-prefers-color");
  if (prefers === "dark") return true;
  if (prefers === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const AntdThemeBridge: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(readDark);

  useEffect(() => {
    const update = () => setIsDark(readDark());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-prefers-color"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export function rootContainer(container: React.ReactNode) {
  return <AntdThemeBridge>{container}</AntdThemeBridge>;
}
