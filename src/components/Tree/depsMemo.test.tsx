import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 2.5.7：`treeConfig` 是 rest 解构包，每次渲染都是新对象。它进了 `handleExpand`
 * 的 `useCallback` 依赖数组 → **展开回调每渲染都换一个新引用**，原样传给 antd Tree。
 *
 * 这里把 antd 的 `Tree` 换成一个只记录 props 的探针，直接比 `onExpand` 的引用。
 * 单独一个文件，是因为 `vi.mock` 是文件级的，不能污染别的用例。
 */

const seen: Record<string, unknown>[] = [];

vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  const Probe = (props: Record<string, unknown>) => {
    seen.push(props);
    return React.createElement(actual.Tree, props);
  };
  Probe.DirectoryTree = actual.Tree.DirectoryTree;
  Probe.TreeNode = actual.Tree.TreeNode;
  return { ...actual, Tree: Probe };
});

import Tree from ".";

const NODES = [{ key: "1", value: "1", title: "节点甲" }];

beforeEach(() => {
  seen.length = 0;
});

describe("Tree：treeConfig 不再让展开回调每渲染换引用", () => {
  it("props 没变时，传给 antd Tree 的 onExpand 保持同一个引用", () => {
    const make = () => <Tree treeData={NODES} />;
    const { rerender } = render(make());
    rerender(make());
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[seen.length - 1].onExpand).toBe(seen[0].onExpand);
  });

  it("消费方传内联的透传配置时也保持同一个引用（浅比较看的是值）", () => {
    const make = () => <Tree treeData={NODES} showLine blockNode />;
    const { rerender } = render(make());
    rerender(make());
    expect(seen[seen.length - 1].onExpand).toBe(seen[0].onExpand);
  });

  it("透传配置真变了仍然透出新引用，且新的 onExpand 调的是新的回调", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Tree treeData={NODES} onExpand={first} />);
    type Expand = (keys: unknown[], info: unknown) => void;
    const before = seen[seen.length - 1].onExpand as Expand;
    rerender(<Tree treeData={NODES} onExpand={second} />);
    const after = seen[seen.length - 1].onExpand as Expand;
    expect(after).not.toBe(before);

    after(["1"], { node: { key: "1" } });
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
