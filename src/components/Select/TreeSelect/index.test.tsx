import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";

import TreeSelect from ".";

/**
 * `open` 在这个组件里是自己记一份的（`useSelectPopupMetrics` 要用），
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

/**
 * 浮层宽度是拿选择器根节点的实际几何算出来的（`popupMatchSelectWidth`）。根节点从前
 * 是靠 antd 渲染期回调 `getPopupContainer` 的副作用捞到的，现在改成从 antd 的 ref
 * 拿 —— 这条守的是「换了拿法之后还量得到根节点」。
 *
 * 横坐标不在这里验：2.8.4 把它整条还给了 antd（见 `../popupPlacement.test.tsx`）。
 */
const selectRoot = (container: HTMLElement) =>
  container.querySelector(".ant-select") as HTMLElement;

describe("TreeSelect 的浮层定位", () => {
  it("浮层挂进选择器根节点，宽度取自根节点的实际几何", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = selectRoot(container);
    Object.defineProperty(root, "offsetWidth", {
      configurable: true,
      value: 234,
    });
    root.getBoundingClientRect = () =>
      ({
        left: 57,
        top: 0,
        right: 291,
        bottom: 0,
        width: 234,
        height: 0,
        x: 57,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.mouseDown(selector(container));

    const popup = await waitFor(() => {
      const el = root.querySelector(".probe-popup") as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(popup.style.width).toBe("234px");
  });
});
