import type { SelectProps as AntdSelectProps } from "antd";

/** `builtinPlacements` 接受的定位表（`@rc-component/trigger` 的 `BuildInPlacements`） */
export type SelectPopupPlacements = NonNullable<
  AntdSelectProps["builtinPlacements"]
>;

/** antd `ConfigProvider` 的 `popupOverflow`（`PopupOverflow`） */
export type SelectPopupOverflow = "viewport" | "scroll";

/**
 * 把「外壳与 antd 触发节点的左右差」做成 antd 定位表里的 `offset`。
 *
 * 四个位置、`overflow`、`htmlRegion`、`dynamicInset` 全部照抄 antd 自己的默认表
 * （`antd/es/select/mergedBuiltinPlacements.js`），只在 x 方向补上这个差 ——
 * 传了 `builtinPlacements`，antd 就会**整表替换**掉它的默认值，少写一项就等于
 * 悄悄改掉一项行为。
 *
 * 左对齐的两个位置要把浮层往左挪 `insetStart`（外壳左缘到触发节点左缘的距离），
 * 右对齐的两个位置要把浮层往右挪 `insetEnd`，摆完浮层正好压住外壳画出来的那个框。
 * 横向贴边收拢（`adjustX`）由 antd 在这个基础上继续算，这里不碰 `left`。
 */
export const buildSelectPopupPlacements = (
  insetStart: number,
  insetEnd: number,
  popupOverflow?: SelectPopupOverflow,
): SelectPopupPlacements => {
  const shared = {
    overflow: { adjustX: true, adjustY: true, shiftY: true },
    htmlRegion: popupOverflow === "scroll" ? ("scroll" as const) : ("visible" as const),
    dynamicInset: true,
  };

  return {
    bottomLeft: { ...shared, points: ["tl", "bl"], offset: [-insetStart, 4] },
    bottomRight: { ...shared, points: ["tr", "br"], offset: [insetEnd, 4] },
    topLeft: { ...shared, points: ["bl", "tl"], offset: [-insetStart, -4] },
    topRight: { ...shared, points: ["br", "tr"], offset: [insetEnd, -4] },
  };
};
