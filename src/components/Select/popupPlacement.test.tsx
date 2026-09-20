import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";

/**
 * 浮层的**横向定位整条还给 antd**。
 *
 * 从前 `Select` / `AutoCompleteSelect` / `TreeSelect` 都往 `styles.popup.root` 里写
 * `left`，而内联 `popupStyle` 在 `@rc-component/trigger` 里是最后展开的
 * （`es/Popup/index.js:169` 的 `...style`），会把 antd 算好的 `offsetStyle.left`
 * 整条盖掉 —— 连同横向贴边收拢（`adjustX`）一起盖没。
 *
 * 现在只把「外壳比 antd 触发节点宽出来的那一圈」做成定位表里的 `offset` 交给 antd。
 * 这一组守两件事：
 *
 * 1. 组件**不再**往浮层内联写 `left` / `right`；
 * 2. 交给 antd 的定位表里，`offset[0]` 就是量出来的那个差（不是写死的 −12）。
 *
 * jsdom 量不到真实几何，所以这里把节点的 `getBoundingClientRect` 换成可控的桩，
 * 只验「谁在决定横坐标、交出去的偏移对不对」，真实像素在浏览器里量。
 */

/** 捕获 hsu-ui 交给 antd `Select` 的 props */
const selectProps: Record<string, unknown>[] = [];

vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  const ActualSelect = actual.Select;

  const Spied = React.forwardRef<unknown, Record<string, unknown>>(
    (props, ref) => {
      selectProps.push(props);
      return React.createElement(
        ActualSelect as unknown as React.ComponentType<Record<string, unknown>>,
        { ...props, ref },
      );
    },
  );
  // 只搬静态属性（`Select.Option` 等）。整个 `Object.assign` 会连 `$$typeof` / `render`
  // 一起覆盖掉，替身当场退化成原件，spy 一条都收不到
  for (const key of Object.keys(ActualSelect)) {
    if (key === "$$typeof" || key === "render") {
      continue;
    }
    (Spied as unknown as Record<string, unknown>)[key] = (
      ActualSelect as unknown as Record<string, unknown>
    )[key];
  }

  return { ...actual, Select: Spied };
});

const Select = (await import(".")).default;
const TreeSelect = (await import("./TreeSelect")).default;

const TREE_DATA = [
  { title: "甲", value: "a" },
  { title: "乙", value: "b" },
];

/** antd v6 的选择器主体是 `.ant-select-content` */
const selector = (container: HTMLElement) =>
  container.querySelector(".ant-select-content") as HTMLElement;

/** 把某个节点的横向几何钉成可控的值 */
const stubRect = (el: HTMLElement, left: number, right: number) => {
  el.getBoundingClientRect = () =>
    ({
      left,
      right,
      top: 0,
      bottom: 0,
      width: right - left,
      height: 0,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
};

const openPopup = async (host: HTMLElement, container: HTMLElement) => {
  fireEvent.mouseDown(selector(container));

  return waitFor(() => {
    const el = host.querySelector(".probe-popup") as HTMLElement;
    expect(el).toBeTruthy();
    return el;
  });
};

describe("浮层的横坐标归 antd", () => {
  it("TreeSelect 不再往浮层内联写 left —— 那层覆盖是空转，却把 adjustX 盖没了", async () => {
    const { container } = render(
      <TreeSelect treeData={TREE_DATA} popupClassName="probe-popup" />,
    );
    const root = container.querySelector(".ant-select") as HTMLElement;
    stubRect(root, 57, 291);

    const popup = await openPopup(root, container);

    // `-1000vw` 是 rc-trigger 自己的待对齐占位值：横坐标由它写，不是我们
    expect(popup.style.left).toBe("-1000vw");
    expect(popup.style.right).toBe("auto");
  });

  it("基础 Select 不再往浮层内联写 left", async () => {
    const { container } = render(
      <Select
        options={[{ label: "甲", value: "a" }]}
        popupClassName="probe-popup"
      />,
    );
    const shell = container.firstElementChild as HTMLElement;
    stubRect(shell, 57, 291);

    const popup = await openPopup(shell, container);

    expect(popup.style.left).toBe("-1000vw");
    expect(popup.style.right).toBe("auto");
  });
});

describe("外壳与触发节点的差做成 antd 定位表的 offset", () => {
  it("offset 用的是量出来的差，不是写死的 12px", async () => {
    selectProps.length = 0;

    const { container } = render(
      <Select
        options={[{ label: "甲", value: "a" }]}
        popupClassName="probe-popup"
      />,
    );
    const shell = container.firstElementChild as HTMLElement;
    const trigger = container.querySelector(".ant-select") as HTMLElement;

    // 外壳 100…400，antd 触发节点 130…390：左边差 30（边框＋内边距＋prefix），右边差 10。
    // 两边故意不相等 —— 相等的话把左右搞反也测不出来
    stubRect(shell, 100, 400);
    stubRect(trigger, 130, 390);

    await openPopup(shell, container);

    await waitFor(() => {
      const latest = selectProps[selectProps.length - 1];
      const placements = latest.builtinPlacements as Record<
        string,
        { offset: number[] }
      >;
      expect(placements.bottomLeft.offset).toEqual([-30, 4]);
    });

    const latest = selectProps[selectProps.length - 1];
    const placements = latest.builtinPlacements as Record<
      string,
      { offset: number[]; points: string[] }
    >;

    expect(placements.topLeft.offset).toEqual([-30, -4]);
    expect(placements.bottomRight.offset).toEqual([10, 4]);
    expect(placements.topRight.offset).toEqual([10, -4]);
    // 横向贴边收拢必须还开着 —— 这正是从前被 left 覆盖吃掉的那一项
    expect(
      (latest.builtinPlacements as Record<string, { overflow: unknown }>)
        .bottomLeft.overflow,
    ).toEqual({ adjustX: true, adjustY: true, shiftY: true });
  });

  it("ConfigProvider 的 popupOverflow 不会在换表的时候丢掉", async () => {
    selectProps.length = 0;

    const { container } = render(
      <ConfigProvider popupOverflow="scroll">
        <Select
          options={[{ label: "甲", value: "a" }]}
          popupClassName="probe-popup"
        />
      </ConfigProvider>,
    );
    const shell = container.firstElementChild as HTMLElement;

    await openPopup(shell, container);

    // 传 builtinPlacements 是**整表替换**掉 antd 的默认表，少搬一项就等于悄悄改掉一项行为
    const latest = selectProps[selectProps.length - 1];
    const placements = latest.builtinPlacements as Record<
      string,
      { htmlRegion: string; dynamicInset: boolean }
    >;

    expect(placements.bottomLeft.htmlRegion).toBe("scroll");
    expect(placements.bottomLeft.dynamicInset).toBe(true);
  });
});
