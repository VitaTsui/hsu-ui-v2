import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";

import Select from ".";

/**
 * 这里盯住的是同一个缺陷的两半，合起来才是「纵向堆叠的多行表单里，值写到上一行头上」：
 *
 * 1. `open` 是受控的，却没把 antd 的 `onOpenChange` 接回来 —— antd 自己决定的每一次关闭
 *    （Esc、点外面、选中一项）都被静默丢掉，浮层关不上；
 * 2. 外壳的 `onClick` 对整棵子树无条件 `setOpen(!open)` —— 清除按钮（✕）在 antd 选择器里、
 *    浮层又被 `getPopupContainer` 挂进了外壳，点它们都会冒泡上来，于是「点 ✕ 清空」
 *    反而把浮层打开。
 *
 * 浮层是 position: fixed 贴在控件正下方的，一旦关不掉就盖住下一行的下拉框，
 * 用户以为点的是下一行，点到的是上一行的选项。
 */

const OPTIONS = [
  { label: "甲", value: "a" },
  { label: "乙", value: "b" },
];

const Controlled: React.FC<{ onChange?: (v: string) => void }> = ({
  onChange,
}) => {
  const [value, setValue] = useState<string | undefined>("a");
  return (
    <Select
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v as string | undefined);
        onChange?.(v as string);
      }}
    />
  );
};

/** 浮层是否真的展开，以 antd 写在输入框上的 aria-expanded 为准 */
const expanded = (container: HTMLElement) =>
  container.querySelector("input")?.getAttribute("aria-expanded");

/** antd v6 的选择器主体是 `.ant-select-content`（v5 的 `.ant-select-selector` 已不存在） */
const selector = (container: HTMLElement) =>
  container.querySelector(".ant-select-content") as HTMLElement;

describe("Select 的开合归属", () => {
  it("按下落在 antd 自己的区域里时，外壳不再翻转开合（点 ✕ 清空不会开浮层）", async () => {
    const { container } = render(<Controlled />);
    // 外壳是画在 antd 选择器外面的那层 div，开合的补偿逻辑挂在它身上
    const shell = container.firstElementChild as HTMLElement;

    expect(expanded(container)).toBe("false");

    const clear = container.querySelector(".ant-select-clear") as HTMLElement;
    expect(clear).toBeTruthy();

    // jsdom 里点 ✕ 之后这枚图标立刻随值一起从 DOM 上摘掉，click 就不再冒泡到外壳了，
    // 真实浏览器里它是会冒上去的。所以这里按真实浏览器的顺序补发：
    // 先在 ✕ 上按下（冒泡到外壳，让外壳记下「这一次按下不归我管」），
    // 再让外壳自己的 click 处理器跑一遍。
    fireEvent.mouseDown(clear);
    fireEvent.click(shell);

    // 值清掉了，但浮层不该因此被打开
    await waitFor(() => {
      expect(expanded(container)).toBe("false");
    });
  });

  it("antd 自己决定的关闭（Esc）能真的关掉浮层", async () => {
    const { container } = render(<Controlled />);

    fireEvent.mouseDown(selector(container));
    fireEvent.click(selector(container));
    await waitFor(() => {
      expect(expanded(container)).toBe("true");
    });

    fireEvent.keyDown(container.querySelector("input") as HTMLElement, {
      key: "Escape",
      keyCode: 27,
    });
    await waitFor(() => {
      expect(expanded(container)).toBe("false");
    });
  });

  it("消费方自己传的 onOpenChange 不会被吃掉", async () => {
    const seen: boolean[] = [];
    const { container } = render(
      <Select
        options={OPTIONS}
        onOpenChange={(visible) => {
          seen.push(visible);
        }}
      />,
    );

    fireEvent.mouseDown(selector(container));
    fireEvent.click(selector(container));
    await waitFor(() => {
      expect(seen).toContain(true);
    });
  });
});
