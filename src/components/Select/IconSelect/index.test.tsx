import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import IconSelect from ".";
import { isIconRegistered } from "../../Icon";

/**
 * `icons`（受限模式）要挡住的，是一个「界面提供了一个选了必被拒的选项」的场面：
 * 消费方随首屏注册的往往只是四整套里的一个小子集，选了子集之外的图标，
 * 存下来就是一个空位（后端还可能直接拒掉）。
 *
 * 所以这组用例盯三件事：
 * 1. 面板里只出现清单里的图标 —— 多一枚都不行；
 * 2. **自由输入被关掉** —— 这是唯一的旁路，没关掉的话第 1 条等于没做；
 * 3. 不传 `icons` 时行为一个字不变 —— 已有消费方零改动。
 */

const ALLOWED = [
  "ant-design:form-outlined",
  "ant-design:close-outlined",
  "ep:arrow-down",
];

/** 点开右侧的图标按钮，把选择面板打开 */
const openPicker = (container: HTMLElement) => {
  const trigger = container.querySelector('[class*="iconShow"]');
  expect(trigger).toBeTruthy();
  fireEvent.click(trigger!);
};

/**
 * 面板格子。Popover 的内容挂在 body 上的 portal 里，**不在** render 返回的 container
 * 里 —— 拿 container 去找会永远是 0 个，看起来像「受限模式把图标全过滤没了」
 */
const iconCells = () =>
  document.body.querySelectorAll('[class*="iconItem"]');

describe("IconSelect 受限模式（icons）", () => {
  it("面板里只出现清单里的图标，Tabs 按清单里的前缀分组", async () => {
    const { container } = render(<IconSelect icons={ALLOWED} />);
    openPicker(container);

    await waitFor(() => {
      expect(screen.getByText("Ant Design")).toBeTruthy();
    });
    // 清单里有 ep，所以它也该有一栏；fa / fa-solid 清单里没有，不该出现
    expect(screen.getByText("Element Plus")).toBeTruthy();
    expect(screen.queryByText("Font Awesome 4")).toBeNull();
    expect(screen.queryByText("Font Awesome 5 Solid")).toBeNull();

    // 当前这一栏（ant-design）里正好是清单里的那两枚，一枚不多
    await waitFor(() => {
      expect(iconCells().length).toBe(2);
    });
  });

  it("空清单就是「一个都不给选」，不是「没限制」", async () => {
    const { container } = render(<IconSelect icons={[]} />);
    openPicker(container);

    await waitFor(() => {
      expect(
        document.body.querySelector('[class*="popoverContent"]')
      ).toBeTruthy();
    });
    expect(iconCells().length).toBe(0);
    expect(screen.queryByText("Ant Design")).toBeNull();
  });

  it("自由输入被关掉 —— 清单外的名字打不进去（不然限制形同虚设）", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IconSelect icons={ALLOWED} onChange={onChange} />
    );

    const input = container.querySelector("input");
    expect(input).toBeTruthy();
    expect(input!.hasAttribute("readonly")).toBe(true);

    // readOnly 让人打不进去。但光有它不够：程序化赋值照样能改到输入框，
    // 所以组件对外发值那一层也要按清单兜住 —— 这里验的就是那一层
    fireEvent.change(input!, { target: { value: "fa:rocket" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("点面板里的图标仍然能选中，选的是带前缀的全名", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <IconSelect icons={ALLOWED} onChange={onChange} />
    );
    openPicker(container);

    await waitFor(() => {
      expect(iconCells().length).toBe(2);
    });
    fireEvent.click(iconCells()[0]);

    expect(onChange).toHaveBeenCalledWith("ant-design:form-outlined");
  });

  it("受限模式一个整集都不加载（那四套约 1.9 MB，没有理由下载）", async () => {
    // 探针：ant-design 集里有、但本库自带的那几十枚里没有的一枚。
    // 整集一旦被加载，组件会顺手把它整套注册掉，这个探针就会翻成 true —— 
    // 拿它当判据比数格子靠谱：格子数由清单决定，加载了也不会变
    const PROBE = "ant-design:zoom-in-outlined";
    expect(isIconRegistered(PROBE)).toBe(false);

    const restricted = render(<IconSelect icons={ALLOWED} />);
    openPicker(restricted.container);
    await waitFor(() => {
      expect(iconCells().length).toBe(2);
    });
    // 加载是异步的，多等几轮再看
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(isIconRegistered(PROBE)).toBe(false);
    restricted.unmount();

    // 探针本身没瞎：不传 icons 时同一栏会把整集拉下来并注册，它就该翻成 true
    const plain = render(<IconSelect />);
    openPicker(plain.container);
    await waitFor(
      () => {
        expect(isIconRegistered(PROBE)).toBe(true);
      },
      { timeout: 10000 }
    );
  }, 20000);
});

describe("IconSelect 向后兼容（不传 icons）", () => {
  it("四整套的 Tabs 照旧全在", async () => {
    const { container } = render(<IconSelect />);
    openPicker(container);

    await waitFor(() => {
      expect(screen.getByText("Ant Design")).toBeTruthy();
    });
    expect(screen.getByText("Element Plus")).toBeTruthy();
    expect(screen.getByText("Font Awesome 4")).toBeTruthy();
    expect(screen.getByText("Font Awesome 5 Solid")).toBeTruthy();
  });

  it("输入框照旧可以自由输入", () => {
    const onChange = vi.fn();
    const { container } = render(<IconSelect onChange={onChange} />);

    const input = container.querySelector("input");
    expect(input!.hasAttribute("readonly")).toBe(false);

    fireEvent.change(input!, { target: { value: "fa:rocket" } });
    expect(onChange).toHaveBeenCalledWith("fa:rocket");
  });
});
