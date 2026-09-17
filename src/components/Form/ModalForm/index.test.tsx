import React from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";

import Form from "..";

/**
 * 盯住的是「表单交给 store 那一跳」的类型闸门。
 *
 * 从前 `onOk` 写死成 `(data: Record<string, unknown>, form) => void`：
 * `Record<string, unknown>` 对**全可选**类型天然可赋值（目标的可选属性靠「不存在」
 * 就能满足），于是处理函数爱声明成什么形状就声明成什么形状，读侧派生字段、
 * 后端压根不收的键，编译器一个都看不住 —— 键对不对得上只能等运行时。
 *
 * 现在 `onOk` 的形状由类型参数 `Values` 说了算：不传保持原样（默认
 * `Record<string, unknown>`，老调用方一行不改），显式传就把这一跳锁死。
 *
 * 注意：这三条是**类型层**的闸门，由 `npx tsc --noEmit` 把关（测试文件在 tsconfig
 * 的 `include` 里）。vitest 这边只负责保证这些写法真的渲染得出来。
 */

/** 写侧形状：后端只收这两个键 */
type DemoSaveData = { cd?: string; nm?: string };

const okButton = () =>
  document.querySelector(".ant-modal-footer .ant-btn-primary") as HTMLElement;

describe("Form.Modal 的 onOk 形状闸门", () => {
  it("不传类型参数 → 默认 Record<string, unknown>，老调用方一行都不用改", async () => {
    const seen: Record<string, unknown>[] = [];

    render(
      <Form.Modal
        open
        formItems={[{ type: "INPUT", name: "cd", label: "编码" }]}
        onOk={(data) => {
          expectTypeOf(data).toEqualTypeOf<Record<string, unknown>>();
          seen.push(data);
        }}
      />,
    );

    fireEvent.click(okButton());
    await waitFor(() => {
      expect(seen).toHaveLength(1);
    });
  });

  it("显式传类型参数 → onOk 拿到的就是声明的那个形状", async () => {
    const seen: DemoSaveData[] = [];

    render(
      <Form.Modal<DemoSaveData>
        open
        formItems={[{ type: "INPUT", name: "cd", label: "编码" }]}
        onOk={(data) => {
          expectTypeOf(data).toEqualTypeOf<DemoSaveData>();
          seen.push(data);
        }}
      />,
    );

    fireEvent.click(okButton());
    await waitFor(() => {
      expect(seen).toHaveLength(1);
    });
  });

  it("处理函数声明了写侧形状里没有的派生字段 → 就地编译不过", () => {
    const withDerived = (data: DemoSaveData & { statusDsr: string }) =>
      void data;

    render(
      <Form.Modal<DemoSaveData>
        open
        formItems={[{ type: "INPUT", name: "cd", label: "编码" }]}
        // @ts-expect-error `statusDsr` 是读侧派生字段，`DemoSaveData` 里没有。
        // 这一行必须编译不过 —— 编得过就说明这一跳还是敞的。
        onOk={withDerived}
      />,
    );

    expect(document.querySelector(".ant-modal")).toBeTruthy();
  });
});
