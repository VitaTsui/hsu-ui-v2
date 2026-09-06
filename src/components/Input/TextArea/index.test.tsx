import React, { useState } from "react";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import TextArea from ".";

/** 受控消费方：`value` 从自己的 state 来，`onChange` 写回同一份 state */
function Controlled({
  onChange,
  initial = "",
  ...rest
}: {
  onChange: (v: string) => void;
  initial?: string;
} & Record<string, unknown>) {
  const [v, setV] = useState(initial);

  return (
    <TextArea
      value={v}
      // 内联箭头：每次渲染都是新引用。消费方最常见的写法，组件必须扛得住
      onChange={(next) => {
        setV(next);
        onChange(next);
      }}
      {...rest}
    />
  );
}

const type = (el: HTMLElement, value: string) =>
  fireEvent.change(el, { target: { value } });

describe("TextArea", () => {
  it("消费方传内联箭头 onChange 时不进入无限循环", async () => {
    const spy = vi.fn();
    render(<Controlled onChange={spy} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;

    type(ta, "a");

    await waitFor(() => expect(spy).toHaveBeenCalledWith("a"));
    // 敲一个字只该回调一次；进了循环这里会是几十上百次
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(ta.value).toBe("a");

    spy.mockClear();
    type(ta, "ab");
    await waitFor(() => expect(spy).toHaveBeenCalledWith("ab"));
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(ta.value).toBe("ab");
  });

  it("全是空白的输入回调成空串，且不反复回调", async () => {
    const spy = vi.fn();
    render(<Controlled onChange={spy} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;

    type(ta, "   ");

    await waitFor(() => expect(spy).toHaveBeenCalledWith(""));
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("非受控：不传 value 时内部自己维护，onChange 照常只回调一次", async () => {
    const spy = vi.fn();
    render(<TextArea defaultValue="x" onChange={spy} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta.value).toBe("x");

    type(ta, "xy");
    await waitFor(() => expect(spy).toHaveBeenCalledWith("xy"));
    expect(spy.mock.calls.length).toBe(1);
    expect(ta.value).toBe("xy");
  });

  it("外部改 value 会同步进输入框，且不额外触发 onChange", async () => {
    const spy = vi.fn();
    const { rerender } = render(<TextArea value="a" onChange={spy} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta.value).toBe("a");

    rerender(<TextArea value="b" onChange={spy} />);
    await waitFor(() => expect(ta.value).toBe("b"));
    expect(spy).not.toHaveBeenCalled();
  });

  it("maxLength 生效，en 时不截断", () => {
    const { unmount } = render(<TextArea maxLength={3} />);
    expect(
      (screen.getByRole("textbox") as HTMLTextAreaElement).maxLength,
    ).toBe(3);
    unmount();

    render(<TextArea maxLength={3} en />);
    expect(
      (screen.getByRole("textbox") as HTMLTextAreaElement).maxLength,
    ).toBe(-1);
  });

  it("disabled 透传", () => {
    render(<TextArea disabled />);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(
      true,
    );
  });

  it("中文输入法组字期间不回调，组完才回调一次", async () => {
    const spy = vi.fn();
    render(<Controlled onChange={spy} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.compositionStart(ta);
    type(ta, "n");
    type(ta, "ni");
    await new Promise((r) => setTimeout(r, 20));
    expect(spy).not.toHaveBeenCalled();

    fireEvent.compositionEnd(ta);
    type(ta, "你");
    await waitFor(() => expect(spy).toHaveBeenCalledWith("你"));
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
  });
  /**
   * 这一条是真正的回归用例：父级用 MobX（`useSyncExternalStore`）回写 value，
   * React 会以同步优先级重渲，组件内排在 effect 里的 state 更新会被那一趟跳过。
   * 旧实现用 state 记「通知过没有」，读到过期记账就会再发一次通知 → 死循环。
   */
  it("父级是 MobX observer、又传内联箭头时也不循环", async () => {
    class Store {
      private _draft: { body: string } | undefined = { body: "hello" };
      constructor() {
        makeAutoObservable(this);
      }
      get draft() {
        return this._draft;
      }
      setBody = (body: string) => {
        if (this._draft) this._draft = { ...this._draft, body };
      };
    }

    const store = new Store();
    const spy = vi.fn();
    const Cmp = observer(() => {
      const { draft, setBody } = store;
      if (!draft) return null;

      return (
        <TextArea
          value={draft.body}
          onChange={(v) => {
            spy(v);
            setBody(v);
          }}
        />
      );
    });

    render(<Cmp />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    type(ta, "helloX");

    await waitFor(() => expect(spy).toHaveBeenCalledWith("helloX"));
    await new Promise((r) => setTimeout(r, 100));
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(store.draft?.body).toBe("helloX");
  });

  it("内联 getRef 也不会把消费方转崩", async () => {
    const seen: unknown[] = [];
    const Cmp = () => {
      const [, setTick] = useState(0);

      return (
        <TextArea
          getRef={(r) => {
            seen.push(r);
            setTick((n) => n + 1);
          }}
        />
      );
    };

    render(<Cmp />);
    await new Promise((r) => setTimeout(r, 100));
    // 只在挂载时交一次 ref；旧写法会跟着每次渲染重跑，这里会是几十上百次
    expect(seen.length).toBe(1);
    expect(seen[0]).not.toBeNull();
  });

  it("外部把 value 置为 undefined 会清空", async () => {
    const { rerender } = render(<TextArea value="a" />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta.value).toBe("a");

    rerender(<TextArea value={undefined} />);
    await waitFor(() => expect(ta.value).toBe(""));
  });

  it("autoSize / textAreaClassName 等透传照旧", () => {
    render(<TextArea textAreaClassName="my-area" autoSize={{ minRows: 3 }} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta.className).toContain("my-area");
  });
});
