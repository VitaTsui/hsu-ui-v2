import React from "react";

import ConfigProvider from "../src/config-provider";

// 文档站运行时（umi rootContainer）：与真实项目入口保持同构 —— 只挂本库的 ConfigProvider，
// 由它一并接管权限、请求实现与设计令牌（含 antd 的 theme.token 与明暗算法）。
//
// 这里刻意不再自己写一份 antd 主题桥接：那份逻辑已经收进 ConfigProvider + useIsDark，
// 文档站直接用它，等于每次跑 Demo 都在验证消费方拿到的是同一套东西。

export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider
      // 给依赖 request 的智能组件（如 ImportForm 下载模板）注入 Demo 用的假请求，避免未注入报错。
      request={{
        get: async () => ({
          code: 0,
          data: { filename: "demo", data: new ArrayBuffer(0) },
        }),
        post: async () => ({ code: 0, data: undefined }),
        del: async () => ({ code: 0, data: undefined }),
        put: async () => ({ code: 0, data: undefined }),
      }}
    >
      {container}
    </ConfigProvider>
  );
}
