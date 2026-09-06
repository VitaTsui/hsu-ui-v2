import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("../ChainGraphServices", () => ({ default: class {} }));

import { useChainGraphLayout } from "./useChainGraphLayout";
import { useChainGraphData } from "./useChainGraphData";
import type ChainGraphServices from "../ChainGraphServices";
import type { TreeGraphData } from "..";

/**
 * ChainGraph 把回调交给图实例，由图实例在后续事件里回调。
 * 这类「出口型」回调进依赖数组，会让消费方传内联箭头时反复触发重排 / 重新 setData。
 */

const DATA = { id: "root", label: "root" } as unknown as TreeGraphData;

describe("useChainGraphLayout", () => {
  const makeGraph = () =>
    ({ changeLayout: vi.fn() }) as unknown as ChainGraphServices & {
      changeLayout: ReturnType<typeof vi.fn>;
    };

  it("getImage 换引用不会重新 changeLayout（整张图重排）", () => {
    const graph = makeGraph();
    const { rerender } = renderHook(
      ({ getImage }: { getImage?: (img: string) => void }) =>
        useChainGraphLayout({ graph, octopus: true, rootLevel: 0, getImage }),
      { initialProps: { getImage: vi.fn() } },
    );

    expect(graph.changeLayout).toHaveBeenCalledTimes(1);

    rerender({ getImage: vi.fn() });
    rerender({ getImage: vi.fn() });

    expect(graph.changeLayout).toHaveBeenCalledTimes(1);
  });

  it("出图时调到的是最新的 getImage，包括从无到有传入的情况", () => {
    const graph = makeGraph();
    const { rerender } = renderHook(
      ({ getImage }: { getImage?: (img: string) => void }) =>
        useChainGraphLayout({ graph, octopus: true, rootLevel: 0, getImage }),
      { initialProps: {} as { getImage?: (img: string) => void } },
    );

    const forwarded = graph.changeLayout.mock.calls[0][2] as (
      img: string,
    ) => void;
    // 没传回调时转发函数照样存在，调用不报错
    expect(() => forwarded("img-0")).not.toThrow();

    const later = vi.fn();
    rerender({ getImage: later });
    // 图实例里存的还是同一个转发函数，但它现在会转给新传入的回调
    forwarded("img-1");
    expect(later).toHaveBeenCalledWith("img-1");
  });
});

describe("useChainGraphData", () => {
  const makeGraph = () =>
    ({ setData: vi.fn() }) as unknown as ChainGraphServices & {
      setData: ReturnType<typeof vi.fn>;
    };

  type Props = {
    getImage?: (img: string) => void;
    labelRender?: (label: TreeGraphData) => string;
    onLayoutingChange?: (v: boolean) => void;
  };

  it("三个回调换引用都不会重新 setData", () => {
    const graph = makeGraph();
    const { rerender } = renderHook(
      (props: Props) => useChainGraphData({ graph, data: DATA, ...props }),
      {
        initialProps: {
          getImage: vi.fn(),
          labelRender: vi.fn(() => "a"),
          onLayoutingChange: vi.fn(),
        } as Props,
      },
    );

    expect(graph.setData).toHaveBeenCalledTimes(1);

    rerender({
      getImage: vi.fn(),
      labelRender: vi.fn(() => "b"),
      onLayoutingChange: vi.fn(),
    });

    expect(graph.setData).toHaveBeenCalledTimes(1);
  });

  it("图实例回调时取到的是最新引用，不是首次 setData 时的那个", () => {
    const graph = makeGraph();
    const firstLabel = vi.fn(() => "first");
    const { rerender } = renderHook(
      (props: Props) => useChainGraphData({ graph, data: DATA, ...props }),
      {
        initialProps: {
          getImage: vi.fn(),
          labelRender: firstLabel,
          onLayoutingChange: vi.fn(),
        } as Props,
      },
    );

    const pushed = graph.setData.mock.calls[0][0] as {
      getImage: (img: string) => void;
      labelRender?: (label: TreeGraphData) => string;
      isLayouting: (v: boolean) => void;
    };

    const nextImage = vi.fn();
    const nextLabel = vi.fn(() => "next");
    const nextLayouting = vi.fn();
    rerender({
      getImage: nextImage,
      labelRender: nextLabel,
      onLayoutingChange: nextLayouting,
    });

    pushed.getImage("img");
    expect(nextImage).toHaveBeenCalledWith("img");

    expect(pushed.labelRender!(DATA)).toBe("next");
    expect(firstLabel).not.toHaveBeenCalled();

    act(() => pushed.isLayouting(false));
    expect(nextLayouting).toHaveBeenCalledWith(false);
  });

  it("labelRender 的「传了才改写 label」语义保留：没传就是 undefined，从无到有会带上", () => {
    const graph = makeGraph();
    const { rerender } = renderHook(
      ({ data, labelRender }: { data: TreeGraphData; labelRender?: Props["labelRender"] }) =>
        useChainGraphData({ graph, data, labelRender }),
      { initialProps: { data: DATA } as { data: TreeGraphData; labelRender?: Props["labelRender"] } },
    );

    expect(graph.setData.mock.calls[0][0].labelRender).toBeUndefined();

    const label = vi.fn(() => "x");
    const nextData = { id: "root2", label: "root2" } as unknown as TreeGraphData;
    rerender({ data: nextData, labelRender: label });

    expect(graph.setData).toHaveBeenCalledTimes(2);
    expect(typeof graph.setData.mock.calls[1][0].labelRender).toBe("function");
    expect(graph.setData.mock.calls[1][0].labelRender(DATA)).toBe("x");
  });
});
