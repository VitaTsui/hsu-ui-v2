import { useCallback, useEffect } from "react";
import ChainGraphServices from "../ChainGraphServices";
import { useLatestRef } from "../../../hooks/useLatestRef";

interface UseChainGraphLayoutProps {
  graph: ChainGraphServices | null;
  octopus?: boolean;
  rootLevel?: number;
  getImage?: (img: string) => void;
}

export function useChainGraphLayout(props: UseChainGraphLayoutProps) {
  const { graph, octopus, rootLevel, getImage } = props;

  // getImage 只是「布局完成后把截图 dataURL 交出去」的出口，不是布局的输入。
  // 它进依赖数组会让消费方每传一次内联箭头就重新 changeLayout 一次 —— 整张图重排；
  // 消费方再把截图存进 state，就变成「重排 → 出图 → setState → 新引用 → 再重排」的死循环。
  // 用引用恒定的转发函数注册，调用时再取最新的 getImage。
  const getImageRef = useLatestRef(getImage);
  const emitImage = useCallback(
    (img: string) => {
      getImageRef.current?.(img);
    },
    [getImageRef],
  );

  useEffect(() => {
    if (graph && octopus !== undefined) {
      graph.changeLayout(octopus, rootLevel, emitImage);
    }
  }, [graph, octopus, rootLevel, emitImage]);
}
