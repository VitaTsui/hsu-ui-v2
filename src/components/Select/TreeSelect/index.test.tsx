import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";

import TreeSelect from ".";

/**
 * `open` 在这个组件里是自己记一份的（`useSelectPopupPosition` 要用），
 * 但从前落地时只写了 `onOpenChange={setOpen}`，而且它排在
 * `{...antdTreeSelectConfig}` 展开**之后** —— 消费方自己传的那个被整个盖掉，
 * 静默丢失。和 2.7.1 修基础 `Select` 时是同一个毛病，只是当时没顺手核同族。
 */

const TREE_DATA = [
  { title: "甲", value: "a", children: [{ title: "甲一", value: "a1" }] },
  { title: "乙", value: "b" },
];

/** antd v6 的选择器主体是 `.ant-select-content` */
const selector = (container: HTMLElement) =>
  container.querySelector(".ant-select-content") as HTMLElement;

describe("TreeSelect 的开合回调归属", () => {
  it("消费方自己传的 onOpenChange 不会被吃掉", async () => {
    const seen: boolean[] = [];
    const { container } = render(
      <TreeSelect
        treeData={TREE_DATA}
        onOpenChange={(visible) => {
          seen.push(visible);
        }}
      />,
    );

    fireEvent.mouseDown(selector(container));
    await waitFor(() => {
      expect(seen).toContain(true);
    });
  });
});
