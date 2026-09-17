import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";

import TreeSelect from ".";

/**
 * 这个文件只放一条测试，而且必须是本文件里**第一次**渲染 TreeSelect。
 * React 对「渲染期改别的组件 state」这条警告是按「正在渲染的组件名」去重的
 * （`didWarnAboutUpdateInRenderForAnotherComponent`，键是 `Portal`），一个模块实例只报一次。
 * 同文件里前面只要有别的用例先展开过浮层，这条就再也抓不到 —— 测试会变成永远通过的摆设。
 * vitest 默认按文件隔离模块，所以单独成文件是唯一可靠的写法。
 *
 * 守的缺陷：`getPopupContainer` 是 antd 的 Portal 在渲染期调的回调，从前在里面直接
 * `setContainerElement()`，于是每次首开浮层都报
 * `Cannot update a component (TreeSelect) while rendering a different component (Portal)`。
 */
describe("TreeSelect 展开浮层", () => {
  it("不会在别的组件渲染过程中改自己的 state", async () => {
    const errors: string[] = [];
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => {
        errors.push(args.map((a) => String(a)).join(" "));
      });

    try {
      const { container } = render(
        <TreeSelect
          treeData={[{ title: "甲", value: "a" }]}
          popupClassName="probe-popup"
        />,
      );

      fireEvent.mouseDown(
        container.querySelector(".ant-select-content") as HTMLElement,
      );
      await waitFor(() => {
        expect(container.querySelector(".probe-popup")).toBeTruthy();
      });

      expect(
        errors.filter((m) => m.includes("while rendering a different component")),
      ).toEqual([]);
    } finally {
      spy.mockRestore();
    }
  });
});
