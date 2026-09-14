import React from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";

import Icon from ".";

/**
 * `Icon` 有三条进出口，每条都出过或差点出「静默空白」：
 *
 * 1. antd 图标名（`UserOutlined`）—— 公开 API，消费方在用。为了不让 846 枚 antd 图标
 *    进所有消费方的产物，这条改成了**逐枚异步加载**（详见组件里的长注释）。
 *    异步化最容易踩的坑就是「改完忘了它其实没渲染出来」，所以这条必须有测试盯着。
 * 2. iconify 图标名（`ep:arrow-down`）—— 库自己注册过的那批，必须同步渲染出 svg。
 * 3. 没注册过的 iconify 名 —— `@iconify/react` 会去公网现拉，拉不到就空白且不报错。
 */
describe("Icon", () => {
  it("antd 图标名异步加载完成后渲染出真图标（公开 API 不能断）", async () => {
    const { container } = render(<Icon icon="UserOutlined" />);

    // 模块还在路上：占位撑住 1em，不让布局抖
    const placeholder = container.querySelector(".anticon");
    expect(placeholder).toBeTruthy();

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeTruthy();
    });
    // antd 自己渲染的 svg 用的是这个 viewBox
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      "64 64 896 896"
    );
  });

  it("换一个 antd 名字也要重新取那一枚（逐枚加载，不是整包到位就完事）", async () => {
    const { container, rerender } = render(<Icon icon="UserOutlined" />);
    await waitFor(() => {
      expect(container.querySelector("svg")).toBeTruthy();
    });

    rerender(<Icon icon="SettingOutlined" />);
    await waitFor(() => {
      // aria-label 是 antd 具名图标组件自己挂的，能区分到底渲染的是哪一枚
      expect(container.querySelector(".anticon-setting")).toBeTruthy();
    });
  });

  it("符合命名规律但 antd 里并不存在的名字，回落到 iconify 那条路，不卡在占位上", async () => {
    const { container } = render(<Icon icon="ThisIconDoesNotExistOutlined" />);
    await waitFor(() => {
      // 回落之后走的是 Iconify 分支：外层 span 里挂的是 iconify 的节点而不是空占位
      const span = container.querySelector(".anticon");
      expect(span?.getAttribute("aria-hidden")).toBeNull();
    });
  });

  it("库自己注册过的 iconify 图标同步渲染，且 viewBox 与 antd 一致", () => {
    const { container } = render(<Icon icon="ant-design:form-outlined" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    // 修过 viewBox，否则同字号下会比 antd 图标小 12.5%
    expect(svg?.getAttribute("viewBox")).toBe("64 64 896 896");
  });

  it("非 ant-design 集的图标同样同步渲染", () => {
    const { container } = render(<Icon icon="ep:arrow-down" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
