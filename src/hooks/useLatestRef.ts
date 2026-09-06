import { useRef } from "react";

/**
 * 把一个每次渲染都可能换引用的值（通常是回调 prop）装进一个**引用恒定**的 ref。
 *
 * 用途只有一个：让 effect 不必把回调放进依赖数组。
 * 回调放进依赖数组、effect 体内又调它，是一条会让消费方死循环的写法——
 * 消费方传内联箭头（`onChange={(v) => setX(v)}`，React 里最常见的写法）时
 * 每次渲染都是新引用 → effect 重跑 → 调回调 → 父级 setState → 再渲染 →
 * 又是新引用 …… 直到 React 抛 `Maximum update depth exceeded`。
 *
 * ```ts
 * const onDoneRef = useLatestRef(onDone);
 * useEffect(() => {
 *   const t = setTimeout(() => onDoneRef.current?.(), 1000);
 *   return () => clearTimeout(t);
 * }, [onDoneRef]); // 只在挂载时跑一次，且永远调到最新的 onDone
 * ```
 *
 * 注意：渲染期间就地赋值。React 官方对 ref 的约束是「不要在渲染中**读**可变值」，
 * 写入最新的 props 是 useEffectEvent 落地前的通行做法（ahooks 的 `useLatest`、
 * React 文档里的 `useEvent` polyfill 都是这么写的）。
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}

export default useLatestRef;
