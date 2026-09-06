import { fireEvent, render, renderHook, act } from "@testing-library/react";
import { Form } from "antd";
import React, { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 2.5.7：把 2.5.6 守卫钉住的「依赖数组里放每渲染新建对象」欠账逐处清掉后的收益证明。
 *
 * 每处缺陷两条用例：
 * 1. **输入没变时不再重算**；
 * 2. **输入真变时仍正确更新**——比前一条更重要，改坏了比不改糟。
 *
 * 「不再重算」有两种判据，按缺陷形态选：
 *
 * - **对照法**（字面量默认值那一类）：同一个组件渲染两次，一次**不传**那个 prop
 *   （走解构默认值，修之前每渲染都是新对象），一次传**模块级稳定引用**的等价空值。
 *   两边渲染出的 DOM 完全一样，antd 内部噪声完全抵消，差值只剩「默认值是不是每次
 *   都新建」这一件事。修之前不传那边严格更多，修之后必须**相等**。
 *   次数由下面的 hook 探针统计（包了 `useMemo` / `useEffect`，只数工厂/回调实跑次数）。
 *
 * - **引用法**（rest 包那一类，本来就没有「传稳定引用」的对照）：直接断言派生值
 *   在重渲染后**还是同一个引用**，也就是 memo 真的命中了。
 */

const probe = { memo: 0, effect: 0 };
(globalThis as Record<string, unknown>).__freshDepsProbe = probe;

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const counters = () =>
    (globalThis as Record<string, unknown>).__freshDepsProbe as typeof probe;
  const useMemo = (fn: () => unknown, deps: unknown[]) =>
    actual.useMemo(() => {
      counters().memo++;
      return fn();
    }, deps);
  const useEffect = (fn: () => unknown, deps: unknown[]) =>
    actual.useEffect(() => {
      counters().effect++;
      return fn() as ReturnType<React.EffectCallback>;
    }, deps);
  // 命名导入与 `React.useMemo(...)` 这两种写法库里都有，两条路都要包上，
  // 否则漏掉的那一半会让用例「怎么改都通过」，等于没测
  return {
    ...actual,
    useMemo,
    useEffect,
    default: {
      ...(actual as unknown as { default: Record<string, unknown> }).default,
      useMemo,
      useEffect,
    },
  };
});

import CheckboxGroup from "../components/Checkbox/CheckboxGroup";
import Operate from "../components/Operate";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import Tree from "../components/Tree";
import ItemContainer from "../components/FormItem/ItemContainer";
import FormCodeMirror from "../components/FormItem/FormCodeMirror";
import { useSearchCommon } from "../components/Search/_hooks/useSearchCommon";
import useTableColumns from "../components/Table/_hooks/useTableColumns";

/** 渲染一次再用**同样的 props** 重渲染一次，返回第二次渲染的重算次数 */
function rerenderCost(make: () => ReactElement) {
  const { rerender, unmount } = render(make());
  const memo0 = probe.memo;
  const effect0 = probe.effect;
  // 必须新建 element：传同一个 element 对象 React 会直接跳过重渲染，测不到东西
  rerender(make());
  const cost = { memo: probe.memo - memo0, effect: probe.effect - effect0 };
  unmount();
  return cost;
}

beforeEach(() => {
  probe.memo = 0;
  probe.effect = 0;
});

// 对照组用的模块级稳定引用：内容与解构默认值完全一致，只是引用恒定
const STABLE_EMPTY: never[] = [];

/* --------------------------- 字面量默认值：对照法 --------------------------- */

describe("Checkbox.Group：options 的默认值不再每渲染新建", () => {
  it("不传 options 时的重算次数 = 传稳定空数组（memo 命中了）", () => {
    const omitted = rerenderCost(() => <CheckboxGroup />);
    const control = rerenderCost(() => <CheckboxGroup options={STABLE_EMPTY} />);
    expect(omitted.memo).toBe(control.memo);
  });

  it("options 真变了仍然渲染出新选项", () => {
    const { rerender, getByText, queryByText } = render(
      <CheckboxGroup options={[{ label: "甲", value: "a" }]} />,
    );
    expect(getByText("甲")).toBeTruthy();
    rerender(<CheckboxGroup options={[{ label: "乙", value: "b" }]} />);
    expect(queryByText("甲")).toBeNull();
    expect(getByText("乙")).toBeTruthy();
  });
});

describe("Operate：menu 的默认值不再每渲染新建", () => {
  it("不传 menu 时的重算次数 = 传稳定空数组", () => {
    const omitted = rerenderCost(() => <Operate title="编辑" />);
    const control = rerenderCost(() => (
      <Operate title="编辑" menu={STABLE_EMPTY} />
    ));
    expect(omitted.memo).toBe(control.memo);
  });

  it("menu 真变了仍然重新算出可见项", () => {
    const { rerender, getByText, queryByText } = render(
      <Operate title="更多" menu={[{ title: "删除" }]} />,
    );
    expect(getByText("删除")).toBeTruthy();
    rerender(<Operate title="更多" menu={[{ title: "归档" }]} />);
    expect(queryByText("删除")).toBeNull();
    expect(getByText("归档")).toBeTruthy();
  });
});

describe("Pagination：pageSizeOptions 的默认值不再每渲染新建", () => {
  it("不传 pageSizeOptions 时的重算次数 = 传稳定空数组", () => {
    const omitted = rerenderCost(() => (
      <Pagination total={100} showSizeChanger />
    ));
    const control = rerenderCost(() => (
      <Pagination total={100} showSizeChanger pageSizeOptions={STABLE_EMPTY} />
    ));
    expect(omitted.memo).toBe(control.memo);
  });

  it("pageSizeOptions / pageSize 真变了仍然重新算出档位（当前 pageSize 始终在内）", () => {
    const { rerender, container } = render(
      <Pagination
        total={100}
        showSizeChanger
        pageSize={10}
        pageSizeOptions={[10, 20]}
      />,
    );
    expect(container.textContent).toContain("10");
    // 换一组档位，且当前 pageSize 不在其中：仍要被补进去（原逻辑）
    rerender(
      <Pagination
        total={100}
        showSizeChanger
        pageSize={15}
        pageSizeOptions={[30, 50]}
      />,
    );
    expect(container.textContent).toContain("15");
  });
});

describe("Select.AutoComplete：options 的默认值不再每渲染新建", () => {
  it("不传 options 时的重算次数 = 传稳定空数组", () => {
    const omitted = rerenderCost(() => <Select.AutoComplete />);
    const control = rerenderCost(() => (
      <Select.AutoComplete options={STABLE_EMPTY} />
    ));
    expect(omitted.memo).toBe(control.memo);
  });

  it("options 真变了仍然重新算出下拉项", () => {
    const { rerender, container } = render(
      <Select.AutoComplete options={[{ value: "alpha" }]} />,
    );
    const input = container.querySelector("input")!;
    fireEvent.mouseDown(input);
    fireEvent.focus(input);
    expect(document.body.textContent).toContain("alpha");
    rerender(<Select.AutoComplete options={[{ value: "beta" }]} />);
    expect(document.body.textContent).toContain("beta");
    expect(document.body.textContent).not.toContain("alpha");
  });
});

describe("Tree：treeData 的默认值不再每渲染新建", () => {
  it("不传 treeData 时的重算/重跑次数 = 传稳定空数组", () => {
    const omitted = rerenderCost(() => <Tree defaultExpandLevel={1} />);
    const control = rerenderCost(() => (
      <Tree defaultExpandLevel={1} treeData={STABLE_EMPTY} />
    ));
    expect(omitted.memo).toBe(control.memo);
    expect(omitted.effect).toBe(control.effect);
  });

  it("treeData 真变了仍然渲染出新节点", () => {
    const { rerender, queryByText } = render(
      <Tree treeData={[{ key: "1", value: "1", title: "节点甲" }]} />,
    );
    expect(queryByText("节点甲")).toBeTruthy();
    rerender(<Tree treeData={[{ key: "2", value: "2", title: "节点乙" }]} />);
    expect(queryByText("节点甲")).toBeNull();
    expect(queryByText("节点乙")).toBeTruthy();
  });
});

describe("FormCodeMirror：rules 的默认值不再每渲染新建", () => {
  it("不传 rules 时的重算次数 = 传稳定空数组", () => {
    const omitted = rerenderCost(() => (
      <Form>
        <FormCodeMirror name="sql" label="SQL" />
      </Form>
    ));
    const control = rerenderCost(() => (
      <Form>
        <FormCodeMirror name="sql" label="SQL" rules={STABLE_EMPTY} />
      </Form>
    ));
    expect(omitted.memo).toBe(control.memo);
  });

  it("rules 真变了仍然并进 mergedRules（必填标记跟着出现）", () => {
    const { container, rerender } = render(
      <Form>
        <FormCodeMirror name="sql" label="SQL" />
      </Form>,
    );
    expect(container.querySelector(".ant-form-item-required")).toBeNull();
    rerender(
      <Form>
        <FormCodeMirror
          name="sql"
          label="SQL"
          rules={[{ required: true, message: "必填" }]}
        />
      </Form>,
    );
    expect(container.querySelector(".ant-form-item-required")).toBeTruthy();
  });
});

/* --------------------------- rest 包 / hook：引用法 -------------------------- */

describe("ItemContainer：tips / tipsConfig 不再让 label 的 memo 恒不命中", () => {
  /** 借 labelRender 这个出口把内部算出来的 label 原样捞出来比引用 */
  const makeItem =
    (seen: ReactNode[], props: Record<string, unknown> = {}) =>
    () => (
      <Form>
        <ItemContainer
          label="名称"
          name="name"
          labelRender={(node) => {
            seen.push(node);
            return node;
          }}
          {...props}
        />
      </Form>
    );

  it("不传 tips 时，重渲染复用同一份 label", () => {
    const seen: ReactNode[] = [];
    const make = makeItem(seen);
    const { rerender } = render(make());
    rerender(make());
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[seen.length - 1]).toBe(seen[0]);
  });

  it("传了 tips（走 tipsConfig 那条分支）时，内容没变也复用同一份 label", () => {
    const seen: ReactNode[] = [];
    // 每次渲染都是新的对象字面量：修之前这让 label 的 memo 恒不命中
    const make = () =>
      makeItem(seen, {
        tips: { title: "说明", icon: "material-symbols:help" },
      })();
    const { rerender } = render(make());
    rerender(make());
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[seen.length - 1]).toBe(seen[0]);
  });

  it("label 真变了仍然算出新的 label", () => {
    const seen: ReactNode[] = [];
    const { rerender, getByText } = render(makeItem(seen, { label: "名称" })());
    rerender(makeItem(seen, { label: "标题" })());
    expect(seen[seen.length - 1]).not.toBe(seen[0]);
    expect(getByText("标题")).toBeTruthy();
  });

  it("tips 内容真变了仍然算出新的 label", () => {
    const seen: ReactNode[] = [];
    const { rerender } = render(
      makeItem(seen, { tips: { title: "说明一" } })(),
    );
    rerender(makeItem(seen, { tips: { title: "说明二" } })());
    expect(seen[seen.length - 1]).not.toBe(seen[0]);
  });
});

const STABLE_SEARCH_ITEMS = [{ label: "名称", name: "name" }];

describe("useSearchCommon：moreSearchItems 的默认值不再每渲染新建", () => {
  const useSubject = (moreSearchItems?: unknown[]) => {
    const [form] = Form.useForm();
    return useSearchCommon({
      form,
      searchItems: STABLE_SEARCH_ITEMS,
      ...(moreSearchItems ? { moreSearchItems } : {}),
      columnNum: 3,
      autoAdaptWidth: false,
      defaultExpanded: false,
      showAllSearchItems: false,
    } as never);
  };

  it("不传 moreSearchItems 时，重渲染复用同一份派生数组", () => {
    const { result, rerender, unmount } = renderHook(() => useSubject());
    const firstMore = result.current.visibleMoreSearchItems;
    const firstCurrent = result.current.currentSearchItems;
    rerender();
    expect(result.current.visibleMoreSearchItems).toBe(firstMore);
    expect(result.current.currentSearchItems).toBe(firstCurrent);
    unmount();
  });

  it("moreSearchItems 真变了仍然重新算出展开后的列表", () => {
    const { result, rerender, unmount } = renderHook(
      ({ more }: { more: unknown[] }) => useSubject(more),
      { initialProps: { more: [{ label: "更多甲", name: "a" }] } },
    );
    act(() => result.current.setExpand?.(true));
    const before = result.current.currentSearchItems.length;
    rerender({
      more: [
        { label: "更多甲", name: "a" },
        { label: "更多乙", name: "b" },
      ],
    });
    expect(result.current.currentSearchItems.length).toBe(before + 1);
    expect(
      result.current.currentSearchItems.some((item) => item.label === "更多乙"),
    ).toBe(true);
    unmount();
  });
});

describe("useTableColumns：columns 的默认值不再每渲染新建", () => {
  const baseParams = {
    enhanceColumns: (c?: unknown) => c,
    _pageNum: 1,
    _pageSize: 10,
  };

  it("不传 columns 时，重渲染复用同一份 _columns（cloneDeep 不再空跑）", () => {
    const { result, rerender, unmount } = renderHook(() =>
      useTableColumns(baseParams as never),
    );
    const first = result.current._columns;
    rerender();
    expect(result.current._columns).toBe(first);
    unmount();
  });

  it("columns 真变了仍然重新算出列", () => {
    const { result, rerender, unmount } = renderHook(
      ({ columns }: { columns: unknown[] }) =>
        useTableColumns({ ...baseParams, columns } as never),
      { initialProps: { columns: [{ title: "甲", dataIndex: "a" }] } },
    );
    expect(result.current._columns[0].title).toBe("甲");
    rerender({
      columns: [
        { title: "甲", dataIndex: "a" },
        { title: "乙", dataIndex: "b" },
      ],
    });
    expect(result.current._columns).toHaveLength(2);
    expect(result.current._columns[1].title).toBe("乙");
    unmount();
  });
});
