import React from "react";
import { describe, expect, it } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";

import TreeSelect from "./TreeSelect";

/**
 * 浮层的测量从「`setInterval(…, 1)` 每毫秒重算一遍」换成事件驱动
 * （`useSelectPopupMetrics` 的 `ResizeObserver`）。这一组守两件事：
 *
 * 1. 浮层开着的时候**没有任何定时器在重复测量**；
 * 2. 不再用 `popup.style.display` 内联覆盖 antd 自己的隐藏类。
 *
 * 横坐标本身已经整条还给 antd（见 `popupPlacement.test.tsx`），宽度跟随见
 * `popupWidth.test.tsx`。
 *
 * jsdom 量不到真实几何，所以这里把根节点的 `getBoundingClientRect` 换成可控的桩，
 * 只验「读没读」，真实像素在浏览器里量。
 */

const TREE_DATA = [
  { title: "甲", value: "a" },
  { title: "乙", value: "b" },
];

/** antd v6 的选择器主体是 `.ant-select-content` */
const selector = (container: HTMLElement) =>
  container.querySelector(".ant-select-content") as HTMLElement;

/** 把某个节点的横坐标钉成可控的值，并顺带数一数它被测量了多少次 */
const stubRect = (el: HTMLElement, left: number) => {
  const state = { left, reads: 0 };

  el.getBoundingClientRect = () => {
    state.reads += 1;

    return {
      left: state.left,
      top: 0,
      right: state.left + 234,
      bottom: 0,
      width: 234,
      height: 0,
      x: state.left,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };

  return state;
};

const wait = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });

describe("浮层的测量不再靠轮询", () => {
  it("浮层开着的时候没有定时器在反复测量触发元素", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = container.querySelector(".ant-select") as HTMLElement;
    const rect = stubRect(root, 57);

    fireEvent.mouseDown(selector(container));
    await waitFor(() => {
      expect(root.querySelector(".probe-popup")).toBeTruthy();
    });

    const readsAfterOpen = rect.reads;
    // 旧实现是 `setInterval(…, 1)`，每次 tick 量两下（top 一下 left 一下）：
    // 300ms 里是几百次。antd 自己收尾的那一两次对齐不算轮询，所以卡在 10 次。
    await wait(300);

    expect(rect.reads - readsAfterOpen).toBeLessThan(10);
  });
});

describe("浮层的显隐归 antd 自己管", () => {
  it("展开时不往浮层上内联写 display", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = container.querySelector(".ant-select") as HTMLElement;
    stubRect(root, 57);

    fireEvent.mouseDown(selector(container));
    const popup = await waitFor(() => {
      const el = root.querySelector(".probe-popup") as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(popup.style.display).toBe("");
  });

  it("收起时也不内联写 display，交给 antd 的隐藏类", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = container.querySelector(".ant-select") as HTMLElement;
    stubRect(root, 57);

    fireEvent.mouseDown(selector(container));
    const popup = await waitFor(() => {
      const el = root.querySelector(".probe-popup") as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(popup.className).toContain("hidden");
    });

    expect(popup.style.display).toBe("");
  });
});
