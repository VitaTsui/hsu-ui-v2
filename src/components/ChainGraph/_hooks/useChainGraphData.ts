import { useCallback, useEffect, useState } from "react";
import { Equal } from "hsu-utils";
import ChainGraphServices from "../ChainGraphServices";
import { TreeGraphData } from "..";
import { useLatestRef } from "../../../hooks/useLatestRef";

interface UseChainGraphDataProps {
  graph: ChainGraphServices | null;
  data?: TreeGraphData;
  level?: number;
  rootLevel?: number;
  getImage?: (img: string) => void;
  labelRender?: (label: TreeGraphData) => string;
  onLayoutingChange?: (isLayouting: boolean) => void;
}

export function useChainGraphData(props: UseChainGraphDataProps) {
  const {
    graph,
    data,
    level,
    rootLevel,
    getImage,
    labelRender,
    onLayoutingChange,
  } = props;
  const [lastData, setLastData] = useState<TreeGraphData | undefined>(
    undefined
  );
  const [isLayouting, setIsLayouting] = useState(true);

  // 这三个回调都是「交给图实例、由它在后续事件里回调」的出口，不是数据本身。
  // 它们进依赖数组是条死依赖：effect 体被 ObjEqual(lastData, data) 挡住，
  // 引用变了也不会重新 setData —— 图里存的还是首次 setData 时那个闭包，
  // 换了引用永远调不到（stale closure）。改成引用恒定的转发函数：
  // 依赖数组只留真正的输入（graph/data/level/rootLevel），调用时总是取到最新的回调。
  const getImageRef = useLatestRef(getImage);
  const labelRenderRef = useLatestRef(labelRender);
  const onLayoutingChangeRef = useLatestRef(onLayoutingChange);

  const emitImage = useCallback(
    (img: string) => {
      getImageRef.current?.(img);
    },
    [getImageRef]
  );
  // labelRender 在 ChainGraphServices.setData 里是「传了才改写 label」的真值判断，
  // 所以这里保留「有没有传」的语义：没传就传 undefined，传了才给转发函数。
  const renderLabel = useCallback(
    (label: TreeGraphData) => labelRenderRef.current!(label),
    [labelRenderRef]
  );
  const emitLayouting = useCallback(
    (value: boolean) => {
      setIsLayouting(value);
      onLayoutingChangeRef.current?.(value);
    },
    [onLayoutingChangeRef]
  );

  useEffect(() => {
    if (graph && !Equal.ObjEqual(lastData, data)) {
      setLastData(data);
      graph.setData({
        data,
        level,
        rootLevel,
        getImage: emitImage,
        isLayouting: emitLayouting,
        labelRender: labelRenderRef.current ? renderLabel : undefined,
      });
    }
  }, [
    graph,
    data,
    level,
    rootLevel,
    lastData,
    emitImage,
    emitLayouting,
    renderLabel,
    labelRenderRef,
  ]);

  return { isLayouting };
}
