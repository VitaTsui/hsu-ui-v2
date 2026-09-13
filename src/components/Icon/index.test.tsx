import React from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";

import Icon from ".";

/**
 * `Icon` 有三条进出口，每条都出过或差点出「静默空白」：
 *
 * 1. antd 图标名（`UserOutlined`）—— 公开 API，消费方在用。为了把 847 枚 antd 图标
 *    从所有消费方的首屏里挪出去，这条改成了**异步加载**（详见组件里的长注释）。
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
