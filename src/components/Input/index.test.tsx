import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";

import Input from ".";
import Slider from "../Slider";

/**
 * `Input` / `Password` / `Search` / `Number` / `Slider` 与 `TextArea` 是同一套写法，
 * 也曾是同一个缺陷：`onChange` 进 effect 依赖数组、effect 体内又调它。
 * 这里逐个盯住「消费方传内联箭头也不会死循环」这条底线。
 */

class Store {
  private _v = "";
  constructor() {
    makeAutoObservable(this);
  }
  get v() {
    return this._v;
  }
  set = (v: string) => {
    this._v = v;
  };
}

const type = (el: HTMLElement, value: string) =>
  fireEvent.change(el, { target: { value } });

const cases: Array<[string, React.FC<{ value: string; onChange: (v: string) => void }>]> = [
  ["Input", (p) => <Input {...p} />],
  ["Input.Password", (p) => <Input.Password {...p} />],
  ["Input.Search", (p) => <Input.Search {...p} />],
];

describe.each(cases)("%s", (name, Cmp) => {
  it("父级是 MobX observer、又传内联箭头时不进入无限循环", async () => {
    const store = new Store();
    const spy = vi.fn();
    const Page = observer(() => (
      <Cmp
        value={store.v}
        onChange={(v) => {
          spy(v);
          store.set(v);
        }}
      />
    ));

    render(<Page />);
    const el = document.querySelector("input") as HTMLInputElement;
    type(el, "a");

    await waitFor(() => expect(spy).toHaveBeenCalledWith("a"));
    await new Promise((r) => setTimeout(r, 100));
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(store.v).toBe("a");
  });

  it("受控回写、外部改值、组字期间不通知", async () => {
    const spy = vi.fn();
    const Page = () => {
      const [v, setV] = useState("");

      return (
        <Cmp
          value={v}
          onChange={(next) => {
            spy(next);
            setV(next);
          }}
        />
      );
    };

    render(<Page />);
    const el = document.querySelector("input") as HTMLInputElement;

    fireEvent.compositionStart(el);
    type(el, "n");
    await new Promise((r) => setTimeout(r, 20));
    expect(spy).not.toHaveBeenCalled();

    fireEvent.compositionEnd(el, { currentTarget: el });
    type(el, "你");
    await waitFor(() => expect(spy).toHaveBeenCalledWith("你"));
    expect(el.value).toBe("你");
  });
});

describe("Input", () => {
  it("escapeCharacters：对内显示原文，对外给转义值", async () => {
    const spy = vi.fn();
    render(<Input escapeCharacters={[","]} onChange={spy} />);
    const el = screen.getByRole("textbox") as HTMLInputElement;

    type(el, "a,b");
    await waitFor(() => expect(spy).toHaveBeenCalledWith("a\\,b"));
    expect(el.value).toBe("a,b");
    expect(spy.mock.calls.length).toBe(1);
  });

  it("外部改 value 会同步进输入框，且不额外触发 onChange", async () => {
    const spy = vi.fn();
    const { rerender } = render(<Input value="a" onChange={spy} />);
    const el = screen.getByRole("textbox") as HTMLInputElement;
    expect(el.value).toBe("a");

    rerender(<Input value="b" onChange={spy} />);
    await waitFor(() => expect(el.value).toBe("b"));
    expect(spy).not.toHaveBeenCalled();
  });

  it("内联 getRef 只在挂载时交一次 ref", async () => {
    const seen: unknown[] = [];
    const Page = () => {
      const [, setTick] = useState(0);

      return (
        <Input
          getRef={(r) => {
            seen.push(r);
            setTick((n) => n + 1);
          }}
        />
      );
    };

    render(<Page />);
    await new Promise((r) => setTimeout(r, 100));
    expect(seen.length).toBe(1);
  });
});

describe("Input.Number", () => {
  it("父级把值转成数字回写、又传内联箭头时不进入无限循环", async () => {
    const spy = vi.fn();
    const Page = () => {
      const [v, setV] = useState<string | number>("");

      return (
        <Input.Number
          value={v}
          onChange={(next) => {
            spy(next);
            // 模拟上游把值转成数字（FormItem 的默认行为），制造一个回环
            setV(next === "" ? "" : Number(next));
          }}
        />
      );
    };

    render(<Page />);
    const el = document.querySelector("input") as HTMLInputElement;

    type(el, "1");
    await waitFor(() => expect(spy).toHaveBeenCalledWith("1"));
    await new Promise((r) => setTimeout(r, 100));
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(el.value).toBe("1");
  });
});

describe("Slider", () => {
  it("内联箭头不循环", async () => {
    const spy = vi.fn();
    const Page = () => {
      const [v, setV] = useState(0);

      return (
        <Slider
          value={v}
          onChange={(next) => {
            spy(next);
            setV(next as number);
          }}
        />
      );
    };

    const { container } = render(<Page />);
    expect(container.querySelector(".ant-slider")).toBeTruthy();
    await new Promise((r) => setTimeout(r, 50));
    // 没有交互就不该有任何通知
    expect(spy).not.toHaveBeenCalled();
  });
});
