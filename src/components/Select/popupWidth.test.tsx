import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";

import Select from ".";
import TreeSelect from "./TreeSelect";

/**
 * 浮层宽度从「渲染期读一次 `offsetWidth` 就定死」换成 `ResizeObserver` 驱动
 * （`useSelectPopupMetrics`）。
 *
 * 这一组守的就是一件事：**控件变宽之后，开着的浮层宽度要跟着变**。
 * 旧写法是 `ref.current.offsetWidth` 这种一次性读，没有任何订阅，控件变宽时组件不重
 * 渲染，宽度就钉在展开那一刻的旧值上 —— 下面每条用例把旧写法还原回去都会失败。
 *
 * 2.8.4 把横坐标整条还给了 antd，顺手删掉了原来为 left 挂的窗口 `resize` 与捕获阶段
 * `scroll` 两个监听。所以这里**只**用 `ResizeObserver` 驱动：宽度如果还偷偷靠那两个
 * 监听才跟得上，这一组会直接红。
 *
 * jsdom 量不到真实几何，所以这里把 `offsetWidth` 换成可控的桩，只验「跟没跟」，
 * 真实像素在浏览器里量。
 */

const TREE_DATA = [
  { title: "甲", value: "a" },
  { title: "乙", value: "b" },
];

/** antd v6 的选择器主体是 `.ant-select-content` */
const selector = (container: HTMLElement) =>
  container.querySelector(".ant-select-content") as HTMLElement;

/** 把某个节点的宽度钉成可控的值 */
const stubWidth = (el: HTMLElement, width: number) => {
  const state = { width };

  Object.defineProperty(el, "offsetWidth", {
    configurable: true,
    get: () => state.width,
  });

  return state;
};

const openPopup = async (host: HTMLElement, container: HTMLElement) => {
  fireEvent.mouseDown(selector(container));

  return waitFor(() => {
    const el = host.querySelector(".probe-popup") as HTMLElement;
    expect(el).toBeTruthy();
    return el;
  });
};

describe("浮层宽度跟着控件走", () => {
  /** 记下每个观察者观察了哪些节点，好只触发盯着目标控件的那一个 */
  let entries: { callback: ResizeObserverCallback; targets: Element[] }[] = [];
  const nativeResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    entries = [];
    globalThis.ResizeObserver = class {
      private entry: { callback: ResizeObserverCallback; targets: Element[] };

      constructor(callback: ResizeObserverCallback) {
        this.entry = { callback, targets: [] };
        entries.push(this.entry);
      }

      observe(target: Element) {
        this.entry.targets.push(target);
      }

      unobserve(target: Element) {
        this.entry.targets = this.entry.targets.filter((it) => it !== target);
      }

      disconnect() {
        this.entry.targets = [];
      }
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = nativeResizeObserver;
  });

  /** 触发盯着 `target` 的那些观察者；顺带断言这样的观察者确实存在 */
  const resizeTo = async (target: Element, size: { width: number }, next: number) => {
    const watching = entries.filter((it) => it.targets.includes(target));
    expect(watching.length).toBeGreaterThan(0);

    size.width = next;
    await act(async () => {
      watching.forEach((it) => {
        it.callback([], {} as ResizeObserver);
      });
    });
  };

  it("TreeSelect：控件变宽，浮层宽度跟上", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = container.querySelector(".ant-select") as HTMLElement;
    const size = stubWidth(root, 300);

    const popup = await openPopup(root, container);
    expect(popup.style.width).toBe("300px");

    // 控件变宽了，但没有任何东西让组件重渲染
    await resizeTo(root, size, 480);

    expect(popup.style.width).toBe("480px");
  });

  it("基础 Select：宽度按外壳算，控件变宽后跟上", async () => {
    const { container } = render(
      <Select
        options={[{ label: "甲", value: "a" }]}
        popupClassName="probe-popup"
      />,
    );
    // 外壳是最外面那层 div（带边框与 11px 内边距），浮层宽度按它给
    const shell = container.firstElementChild as HTMLElement;
    const size = stubWidth(shell, 260);

    const popup = await openPopup(shell, container);
    expect(popup.style.width).toBe("260px");

    // antd 自己的触发节点也要盯着：外壳尺寸没变、只有 prefix 变宽时，
    // 「外壳与触发节点的差」会变，而只观察外壳是收不到的
    const trigger = container.querySelector(".ant-select") as HTMLElement;
    expect(entries.some((it) => it.targets.includes(trigger))).toBe(true);

    await resizeTo(shell, size, 388);

    expect(popup.style.width).toBe("388px");
  });
});
