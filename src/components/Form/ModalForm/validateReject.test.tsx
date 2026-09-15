import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";

import ModalForm from ".";

/**
 * 守的是这条缺陷：必填校验没通过时，界面正确拦住了（红字出来、弹窗不关），
 * 控制台却同时多一条 `unhandledrejection` —— 因为 `_onOk` 只挂了 `.then`，
 * 没接 `validateFields()` 的 reject。
 *
 * 同时守住另一半：**非校验异常必须照常抛出去**，不许被那条 reject 处理顺手吃掉。
 */

const rejections: unknown[] = [];
const onUnhandled = (reason: unknown) => {
  rejections.push(reason);
};
process.on("unhandledRejection", onUnhandled);

afterEach(() => {
  rejections.length = 0;
});

/** 等到 node 把这一轮的未处理 rejection 判定完 */
const flush = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
};

/** 底部「确定」按钮 —— antd 给它 primary 样式，按 class 找比按文案稳 */
const clickOk = () => {
  const ok = document.querySelector(
    ".ant-modal-footer .ant-btn-primary"
  ) as HTMLButtonElement | null;
  expect(ok).toBeTruthy();
  fireEvent.click(ok as HTMLButtonElement);
};

describe("ModalForm 提交时的校验 reject", () => {
  it("必填没填：不调 onOk，也不留下未处理的 rejection", async () => {
    const onOk = vi.fn();
    render(
      <ModalForm
        open
        getContainer={false}
        onOk={onOk}
        formItems={[{ type: "INPUT", name: "nm", label: "展示名称", required: true }]}
      />
    );

    clickOk();
    await flush();

    expect(onOk).not.toHaveBeenCalled();
    expect(rejections).toHaveLength(0);
  });

  it("非校验异常照常抛出去，不被这一层吞掉", async () => {
    const boom = new Error("接口 500");
    render(
      <ModalForm
        open
        getContainer={false}
        onOk={() => {
          throw boom;
        }}
        formItems={[{ type: "INPUT", name: "nm", label: "展示名称" }]}
      />
    );

    clickOk();
    await waitFor(() => expect(rejections).toContain(boom));
  });
});
