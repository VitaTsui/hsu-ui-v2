import fs from "node:fs";
import path from "node:path";
import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import Modal from ".";
import { modalMinHeight } from "../../styles/tokens";

/**
 * 「内容异步加载的弹窗要有高度下界」这条能力的守卫。
 *
 * 缺陷长什么样：详情 / 消息 / 执行记录这类弹窗打开那一刻只有标题栏那么高，
 * 接口回来再撑开 —— 视觉上跳一下。给下界就不跳。
 *
 * 两条底线一起盯：
 * 1. **不传 `minHeight` 的弹窗不许变高** —— 否则两个输入框的短表单会平白留一片空白；
 * 2. 下界必须在 CSS 里与 `90vh` 取小 —— `min-height` 在 CSS 里赢过 `max-height`，
 *    直接落成内联 `min-height` 的话矮窗口会被顶出屏幕。所以组件只写 CSS 变量，
 *    clamp 留在样式表里，这里连样式表那一行也一并守住。
 */

/** antd 的 container 语义槽就是承载 `.content`（flex 列 ＋ max-height: 90vh）的那一层 */
const container = () =>
  document.querySelector(".ant-modal-content, .ant-modal-container") as
    | HTMLElement
    | null;

const minHeightVar = () =>
  container()?.style.getPropertyValue("--vita-modal-min-height") ?? "";

describe("Modal minHeight", () => {
  it("不传时不写下界 —— 短表单不会平白变高", () => {
    render(
      <Modal open getContainer={false}>
        x
      </Modal>
    );

    expect(container()).toBeTruthy();
    expect(minHeightVar()).toBe("");
  });

  it("minHeight 传 true 用标准档（与 Panel.List.Modal 同一个 700）", () => {
    render(
      <Modal open minHeight getContainer={false}>
        x
      </Modal>
    );

    expect(minHeightVar()).toBe(`${modalMinHeight}px`);
  });

  it("数字按 px、字符串原样、false 等于不设", () => {
    const { unmount } = render(
      <Modal open minHeight={520} getContainer={false}>
        x
      </Modal>
    );
    expect(minHeightVar()).toBe("520px");
    unmount();

    const second = render(
      <Modal open minHeight="60vh" getContainer={false}>
        x
      </Modal>
    );
    expect(minHeightVar()).toBe("60vh");
    second.unmount();

    render(
      <Modal open minHeight={false} getContainer={false}>
        x
      </Modal>
    );
    expect(minHeightVar()).toBe("");
  });

  it("调用方自己的 styles.container 不会被吃掉", () => {
    render(
      <Modal
        open
        minHeight
        styles={{ container: { borderRadius: "4px" } }}
        getContainer={false}
      >
        x
      </Modal>
    );

    expect(container()?.style.borderRadius).toBe("4px");
    expect(minHeightVar()).toBe(`${modalMinHeight}px`);
  });

  it("样式表里 clamp 到 90vh —— 矮窗口不会被顶出屏幕", () => {
    const scss = fs.readFileSync(
      path.resolve(__dirname, "index.module.scss"),
      "utf8"
    );

    expect(scss).toMatch(
      /min-height:\s*min\(var\(--vita-modal-min-height,\s*0px\),\s*90vh\)/
    );
  });
});
