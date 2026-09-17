import React from "react";
import { describe, expect, it } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";

import Select from ".";
import TreeSelect from "./TreeSelect";

/**
 * 浮层的 left 从「`setInterval(…, 1)` 每毫秒重算一遍」换成事件驱动
 * （`useSelectPopupLeft`：`ResizeObserver` ＋ 捕获阶段的 `scroll` ＋ 窗口 `resize`）。
 * 这一组守三件事：
 *
 * 1. 浮层开着的时候**没有任何定时器在重复测量**；
 * 2. 控件横向移动了（resize / 滚动）浮层要跟上 —— 旧实现里这一项是靠轮询兜的，
 *    而且首开时轮询根本没建起来，所以旧实现在首开后 resize 会偏（实测 156px）；
 * 3. 不再用 `popup.style.display` 内联覆盖 antd 自己的隐藏类。
 *
 * jsdom 量不到真实几何，所以这里把根节点的 `getBoundingClientRect` 换成可控的桩，
 * 只验「读没读、跟没跟」，真实像素在浏览器里量。
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

describe("浮层的 left 不再靠轮询", () => {
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

  it("窗口 resize 之后 left 跟着触发元素走", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = container.querySelector(".ant-select") as HTMLElement;
    const rect = stubRect(root, 57);

    fireEvent.mouseDown(selector(container));
    const popup = await waitFor(() => {
      const el = root.querySelector(".probe-popup") as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(popup.style.left).toBe("57px");

    // 控件横向移动了，但没有任何东西让组件重渲染
    rect.left = 213;
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(popup.style.left).toBe("213px");
  });

  it("祖先滚动之后 left 跟着触发元素走", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = container.querySelector(".ant-select") as HTMLElement;
    const rect = stubRect(root, 57);

    fireEvent.mouseDown(selector(container));
    const popup = await waitFor(() => {
      const el = root.querySelector(".probe-popup") as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    rect.left = 91;
    // scroll 不冒泡，靠的是 window 上的捕获阶段监听
    await act(async () => {
      root.dispatchEvent(new Event("scroll", { bubbles: false }));
    });

    expect(popup.style.left).toBe("91px");
  });

  it("基础 Select 的 left 按外壳算，resize 之后照样跟得上", async () => {
    const { container } = render(
      <Select
        options={[{ label: "甲", value: "a" }]}
        popupClassName="probe-popup"
      />,
    );
    // 外壳是最外面那层 div（带边框与 11px 内边距），比 antd 自己的触发节点靠左 12px
    const shell = container.firstElementChild as HTMLElement;
    const rect = stubRect(shell, 57);

    fireEvent.mouseDown(selector(container));
    const popup = await waitFor(() => {
      const el = shell.querySelector(".probe-popup") as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(popup.style.left).toBe("57px");

    rect.left = 160;
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(popup.style.left).toBe("160px");
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
