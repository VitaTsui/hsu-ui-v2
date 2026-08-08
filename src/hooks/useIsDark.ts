import { useEffect, useState } from "react";

/**
 * Attributes that mark the document as dark. These are the same selectors the generated
 * `tokens.scss` keys off, so the CSS-variable layer and the antd theme always agree on which
 * palette is active — `data-theme` is what consuming apps toggle, the `prefers-color*` pair is
 * what the dumi docs site sets.
 */
const DARK_ATTRS = [
  "data-theme",
  "data-prefers-color",
  "data-prefers-color-scheme",
] as const;

const read = (): boolean => {
  if (typeof document === "undefined") return false;

  const root = document.documentElement;
  for (const attr of DARK_ATTRS) {
    const value = root.getAttribute(attr);
    if (value === "dark") return true;
    if (value === "light") return false;
  }

  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
};

/**
 * Whether the document is currently in dark mode.
 *
 * The CSS variables switch on their own — they are plain CSS. antd's theme cannot: its tokens are
 * computed in JS, so the algorithm has to be swapped on re-render. This hook is that bridge, and
 * `ConfigProvider` uses it to pick `darkAlgorithm`.
 */
const useIsDark = (): boolean => {
  const [isDark, setIsDark] = useState(read);

  useEffect(() => {
    const update = () => setIsDark(read());
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [...DARK_ATTRS],
    });

    // Only relevant while no explicit attribute is set, but harmless otherwise.
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", update);

    return () => {
      observer.disconnect();
      media?.removeEventListener?.("change", update);
    };
  }, []);

  return isDark;
};

export default useIsDark;
