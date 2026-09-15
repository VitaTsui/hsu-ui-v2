/**
 * jsdom 没有 `matchMedia` / `ResizeObserver`，antd 与 rc-* 会直接调它们。
 * 这里补齐，缺一个就整个测试文件起不来
 */
import "@testing-library/react";

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (!(globalThis as { ResizeObserver?: unknown }).ResizeObserver) {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * jsdom 的 `canvas.getContext("2d")` 没实现（不装原生 `canvas` 包就返回 null 并打一条
 * "Not implemented" 噪音）。`useLabelWidth` → `hsu-utils/GetStrSize` 会往这个 context 上
 * 写 `font` 再 `measureText`，拿到 null 直接 TypeError，整个测试文件起不来。
 * 这里换成一个只够量文字尺寸的替身：宽度按字符数估，`actualBoundingBox*` 也要给，
 * 少一个字段 `GetStrSize` 里的 `toFixed` 就炸。
 */
HTMLCanvasElement.prototype.getContext = ((type: string) =>
  type === "2d"
    ? {
        font: "",
        measureText: (text: string) => ({
          width: text.length * 12,
          actualBoundingBoxAscent: 10,
          actualBoundingBoxDescent: 2,
        }),
      }
    : null) as unknown as HTMLCanvasElement["getContext"];
