/**
 * 布局层用到的一点点本地持久化：外观模式与语言，各是一个字符串。
 *
 * 消费方原本用的是一个 web-storage-cache 封装 + 一张全局 CACHE_KEY 表。那张表属于应用，
 * 不该跟着组件进库；而这里的需求只有「读一个字符串 / 写一个字符串」，直接用 localStorage
 * 就够了，也不必为此多一个运行时依赖。
 *
 * key 统一加 `hsu-ui:` 前缀，避免和消费方自己的存储撞名。
 */
const PREFIX = "hsu-ui:";

export const readStorage = (key: string): string | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(PREFIX + key) ?? undefined;
  } catch {
    // 隐私模式 / 禁用存储时 localStorage 会抛异常，静默降级为「没有缓存」
    return undefined;
  }
};

export const writeStorage = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // 同上：写不进去不该让界面崩掉
  }
};

export const STORAGE_KEY = {
  APPEARANCE: "appearance",
  LANG: "lang",
} as const;
