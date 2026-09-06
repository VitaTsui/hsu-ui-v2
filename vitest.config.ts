import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * 组件库的单测。跑的是 `src/` 下的**源码**（不是 `es/` 产物），
 * 所以改完源码不用先 build 就能验。
 */
export default defineConfig({
  resolve: {
    alias: {
      "@hsu-react/ui": path.resolve(__dirname, "src/index.ts"),
    },
  },
  css: {
    // scss module 在测试里只需要能拿到类名，不需要真的编译出样式
    modules: { classNameStrategy: "non-scoped" },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/__tests__/setup.ts"],
  },
});
