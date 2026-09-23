import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

import Table from ".";

/**
 * `virtual` 必须真的虚拟化。
 *
 * antd 的虚拟表格只认**数字**的 `scroll.y`；本组件曾在 `virtual` 时干脆不传 `scroll`，
 * 结果虚拟化根本没启用 —— 1069 行 × 44 列的表照样画出 4.8 万个格子、首屏 10 秒，
 * 再大一点浏览器直接卡死。消费方只好自己把表夹到 200 行 × 20 列，数据被截掉一大半。
 *
 * jsdom 没有布局，所有元素的 clientHeight 都是 0；这里给它一个固定高度，
 * 模拟「父级有确定高度」这个使用前提。
 */

// 够大到「全画」与「只画可见」一眼分得开，又不至于让没修好的旧代码把 jsdom 撑爆
const ROWS = 300;
const COLS = 10;

const columns = Array.from({ length: COLS }, (_, i) => ({
  title: `C${i}`,
  dataIndex: `c${i}`,
  width: 100,
}));
const dataSource = Array.from({ length: ROWS }, (_, r) => {
  const row: Record<string, string | number> = { key: r };
  for (let c = 0; c < COLS; c++) {
    row[`c${c}`] = `${r}-${c}`;
  }
  return row;
});

describe("Table virtual", () => {
  let heightSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    heightSpy = vi
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockReturnValue(400);
    warnSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    heightSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("只画看得见的行，而不是整张表", async () => {
    const { container } = render(
      <div style={{ height: 400, display: "flex", flexDirection: "column" }}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          virtual
        />
      </div>,
    );

    await waitFor(() => {
      expect(container.querySelector(".ant-table-tbody-virtual")).not.toBeNull();
    });
    const rendered = container.querySelectorAll(".ant-table-row").length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(100);

    // antd 在拿不到数字尺寸时会报这条 —— 出现就说明又退回了「不传 scroll」
    const msgs = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(msgs.some((m) => m.includes("in virtual table must be number"))).toBe(
      false,
    );
  });
});
