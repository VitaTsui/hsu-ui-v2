import { useRef } from "react";

/**
 * 把一个**内容没变、但每次渲染都新建**的对象收敛成**引用恒定**的对象：
 * 浅比较（自有键 ＋ `Object.is` 比值）相等就继续返回上一次那个引用。
 *
 * 用途只有一个：让它可以直接进 `useMemo` / `useEffect` 的依赖数组。
 *
 * React 的依赖数组按 `Object.is` 比引用，所以依赖里只要混进一个「每次渲染都新建
 * 的对象」，memo 就**恒不命中**、effect 就**每渲染必重跑**。组件内部最容易出现
 * 这种对象的地方是 rest 解构：
 *
 * ```tsx
 * const { className, style, ...coreOption } = props; // coreOption 每次都是新对象
 * const option = useMemo(() => ({ ...coreOption }), [coreOption]); // 永远不命中
 * ```
 *
 * 消费方就算把每一个 prop 都 memo 好，也躲不掉——新对象是组件自己建的。
 * 正确写法是让这个对象回到值语义：
 *
 * ```tsx
 * const { className, style, ...restOption } = props;
 * const coreOption = useShallowStable(restOption); // 内容不变 → 引用不变
 * ```
 *
 * 注意这**不是**「缓存结果跳过副作用」：memo 该重算时照样重算、effect 该重跑时
 * 照样重跑——只要 rest 里任何一个值真的变了，浅比较就不相等，新引用立刻透出去。
 *
 * 渲染期间读写 ref 的安全性：并发渲染下被丢弃的那次渲染可能已经把 ref 换成了它
 * 自己的对象，但那个对象与当次 props 浅相等，所以后续渲染拿到的引用**内容永远
 * 与当前 props 一致**，不会读到过期值。
 */
export function useShallowStable<T extends object>(value: T): T {
  const ref = useRef(value);

  if (!shallowEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}

function shallowEqual(a: object, b: object) {
  if (Object.is(a, b)) return true;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }

  return true;
}

export default useShallowStable;
