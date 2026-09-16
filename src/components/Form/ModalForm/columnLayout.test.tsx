import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import ModalForm from ".";
import styles from "./index.module.scss";
import type { FormItemProps } from "../../FormItem";

/**
 * 守的是这条缺陷：`columnNum` 只喂给一个挂在 `.horizontal` 下才生效的 CSS 变量，
 * 而 `.horizontal` 又只有 `layout="horizontal"` 才加 —— 于是 `<Form.Modal columnNum={2}>`
 * 静默退化成单栏，调用方以为自己配了两栏。
 *
 * 现在分栏只看 `columnNum`，`layout` 退成它的默认值来源。所以这里既要守住
 * 「只给 columnNum 也分栏」，也要守住旧写法 `layout="horizontal"` 的表现一字不变。
 */

const formItems: FormItemProps[] = [
  { type: "INPUT", name: "a", label: "甲" },
  { type: "INPUT", name: "b", label: "乙" },
  { type: "INPUT", name: "c", label: "丙" },
];

/** 分栏的唯一外在标志：根节点的 multiColumn 类 ＋ 弹窗宽档 */
const layoutOf = () => {
  const root = document.querySelector<HTMLElement>(`.${styles.ModalForm}`);
  expect(root).toBeTruthy();
  return {
    multiColumn: root!.classList.contains(styles.multiColumn),
    width: root!.style.width,
  };
};

describe("ModalForm 的分栏判据", () => {
  it("只给 columnNum={2}：分栏生效，弹窗走宽档", () => {
    render(<ModalForm open getContainer={false} columnNum={2} formItems={formItems} />);
    expect(layoutOf()).toEqual({ multiColumn: true, width: "1200px" });
  });

  it("旧写法 layout=\"horizontal\" 不带 columnNum：仍是两栏宽档，表现不变", () => {
    render(<ModalForm open getContainer={false} layout="horizontal" formItems={formItems} />);
    expect(layoutOf()).toEqual({ multiColumn: true, width: "1200px" });
  });

  it("什么都不给：单栏窄档，表现不变", () => {
    render(<ModalForm open getContainer={false} formItems={formItems} />);
    expect(layoutOf()).toEqual({ multiColumn: false, width: "800px" });
  });

  it("columnNum={1}：单栏窄档", () => {
    render(<ModalForm open getContainer={false} columnNum={1} formItems={formItems} />);
    expect(layoutOf()).toEqual({ multiColumn: false, width: "800px" });
  });
});
