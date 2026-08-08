/**
 * Helpers for antd v6's semantic `classNames` / `styles` props.
 *
 * In v5 these were plain objects, so wrappers could merge their own class names with the caller's
 * by spreading. v6 widened them to `object | ((info) => object)` so a caller can decide per render
 * — which breaks every `classNames?.header` read in this library.
 *
 * Reading only the object branch (or ignoring the function branch) would silently drop whatever a
 * caller passed as a function. `mergeSemantic` instead always hands antd back the *function* form:
 * antd calls it, we resolve the caller's value at that moment, and merge our own on top. Both
 * branches are therefore honoured, and the merge stays lazy just like antd expects.
 */

/** The function branch of a semantic prop, e.g. `ModalProps["classNames"]` */
type SemanticFn<P> = Extract<NonNullable<P>, (...args: never[]) => unknown>;

/** The resolved object a semantic prop yields, with `undefined` stripped */
type SemanticValue<P> = NonNullable<ReturnType<SemanticFn<P>>>;

/**
 * Merge this library's own semantic slots onto whatever the caller passed.
 *
 * @param incoming the caller's `classNames` / `styles` prop, in either form
 * @param merge receives the caller's resolved slots (`{}` when they passed nothing) and returns the
 *   merged result — spread `outer` first, then override the slots this component owns
 *
 * @example
 * classNames={mergeSemantic(classNames, (outer) => ({
 *   ...outer,
 *   body: `${styles.body} ${outer.body ?? ""}`,
 * }))}
 */
export function mergeSemantic<P>(
  incoming: P,
  merge: (outer: Partial<SemanticValue<P>>) => SemanticValue<P>
): SemanticFn<P> {
  const resolve = (info: unknown) =>
    merge(
      ((typeof incoming === "function"
        ? (incoming as (i: unknown) => unknown)(info)
        : incoming) ?? {}) as Partial<SemanticValue<P>>
    );

  return resolve as SemanticFn<P>;
}
