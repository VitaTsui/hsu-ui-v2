import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { useOnlyLvOneMenu } from "./useOnlyLvOneMenu";
import type { MenuType } from "..";

const ITEMS = [
  { key: "/orch", label: "编排", children: [{ key: "/orch/a", label: "A" }] },
] as unknown as MenuType[];

/**
 * 这个 effect 干的是：路由变了就把当前一级菜单的子项交给消费方，并同步展开态。
 * getCurrChildItems 是 effect 体里发出去的通知 —— 它进依赖数组，
 * 配上每次都新建数组的 setOpenkeys([item.key])，就是标准的死循环配方。
 */
function Host({ onChildren }: { onChildren: (c: MenuType[]) => void }) {
  const [, setOpenkeys] = useState<string[]>([]);
  const [, setMenuKey] = useState("");
  const [children, setChildren] = useState<MenuType[]>([]);

  useOnlyLvOneMenu({
    items: ITEMS,
    onlyLvOneMenu: true,
    // 内联箭头 + 每次都是新数组：最坏情况的消费方写法
    getCurrChildItems: (c) => {
      onChildren(c);
      setChildren([...c]);
    },
    setOpenkeys,
    setMenuKey,
  });

  return <div data-testid="count">{children.length}</div>;
}

describe("useOnlyLvOneMenu", () => {
  it("内联 getCurrChildItems 回写 state 不会死循环", () => {
    const spy = vi.fn();

    const { getByTestId } = render(
      <MemoryRouter
        initialEntries={["/orch/a"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Host onChildren={spy} />
      </MemoryRouter>,
    );

    expect(getByTestId("count").textContent).toBe("1");
    // 进了循环这里会是几十上百次，直到 React 抛 Maximum update depth exceeded
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(spy).toHaveBeenCalledWith(ITEMS[0].children);
  });
});
