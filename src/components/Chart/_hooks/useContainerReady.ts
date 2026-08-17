import { RefObject, useEffect, useState } from "react";

/**
 * Whether the referenced element has a non-zero box yet.
 *
 * `echarts.init` on a 0×0 element logs `Can't get DOM width or height` and builds a canvas with no
 * size, recovering only on the next `resize()`. A chart hits that path whenever it mounts before
 * layout has given it space — inside a keep-alive tab that is not the active one, a collapsed
 * panel, a modal that has not opened yet — so consuming apps see the warning for charts that end
 * up rendering perfectly well.
 *
 * Gating `init` on this flag defers it to the first frame the element actually occupies space.
 *
 * It **latches**: once measured, the element going back to 0×0 (a keep-alive tab losing focus)
 * must not read as "not ready" again, or the init effect would tear the chart down and re-create
 * it on every tab switch.
 */
const useContainerReady = (ref: RefObject<HTMLElement | null>): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    const el = ref.current;
    if (!el) return;

    const measure = (): boolean => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setReady(true);
        return true;
      }
      return false;
    };

    // Already laid out on mount — the common case, and it must not cost an extra frame
    if (measure()) return;

    const observer = new ResizeObserver(() => {
      if (measure()) observer.disconnect();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [ready, ref]);

  return ready;
};

export default useContainerReady;
