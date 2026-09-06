import React, { useCallback, useEffect, useMemo, useRef } from "react";
import useContainerReady from "../_hooks/useContainerReady";
import styles from "../index.module.scss";
import { ChartCommonProps, ChartOptionType, ChartsOption } from "..";
import * as echarts from "echarts";
import useLatestRef from "../../../hooks/useLatestRef";

type SankeyNodeItemOption = echarts.SankeySeriesOption["data"];
type SankeyEdgeItemOption = echarts.SankeySeriesOption["links"];

export interface ChartSankeyProps extends ChartCommonProps {
  seriesData: SankeyNodeItemOption;
  seriesLinks: SankeyEdgeItemOption;
  getImage?: (img: string) => void;
}

const Sankey: React.FC<ChartSankeyProps> = (props) => {
  const { className, style, seriesData, seriesLinks, series, getImage } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  // Defers `echarts.init` until the container has a box — see the hook for why
  const containerReady = useContainerReady(chartRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Cache the chart option with useMemo
  const chartOption = useMemo(() => {
    const option: ChartsOption = {
      series: {
        type: "sankey",
        layout: "none",
        top: 0,
        left: 0,
        right: 180,
        bottom: 0,
        nodeGap: 1,
        layoutIterations: 0,
        data: seriesData?.map((item) => {
          return {
            name: item.name,
            itemStyle: {
              color: "#156FFF",
            },
            label: {
              position: "right",
              textStyle: {
                fontWeight: 800,
              },
            },
          };
        }),
        links: seriesLinks?.map((item) => {
          return { ...item, value: 10 };
        }),
        draggable: true,
        roam: true,
        focusNodeAdjacency: "allEdges",
        levels: [
          {
            depth: 0,
            itemStyle: {
              color: "yellow",
            },
            lineStyle: {
              color: "source",
              opacity: 0.2,
            },
          },
          {
            depth: 1,
            lineStyle: {
              color: "source",
              opacity: 0.2,
            },
          },
          {
            depth: 2,
            lineStyle: {
              color: "source",
              opacity: 0.2,
            },
          },
          {
            depth: 3,
            label: {
              fontSize: 12,
            },
          },
        ],
        label: {
          fontSize: 14,
          color: "#666",
        },
        itemStyle: {
          color: "transparent",
          borderColor: "transparent",
          borderWidth: 20,
        },
        ...series,
      } as ChartOptionType,
    };

    return option;
  }, [seriesData, seriesLinks, series]);

  // getImage 只是「出图后把 dataURL 交出去」的出口，既不决定图怎么画，
  // 也不该决定要不要重画。它进依赖数组会让 effect 跟着重跑 → setOption(notMerge)
  // → 图重绘 → 再触发一次 finished → 再回调；消费方把图存进 state 就是死循环。
  // 而且 finished 监听只在首次 init 时注册，闭包里锁死的是首帧的 getImage，
  // 后续换了引用永远调不到 —— 依赖数组写了它也没用，是条死依赖。走 ref 两个问题一起解决。
  const getImageRef = useLatestRef(getImage);

  // Callback handling chart resize
  const handleResize = useCallback(() => {
    // A keep-alive tab losing focus fires the observer with a 0×0 box; resizing to that throws
    // the laid-out canvas away and it has to be rebuilt when the tab comes back
    const el = chartRef.current;
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;

    chartInstanceRef.current?.resize();
  }, []);

  // Initialize the chart
  useEffect(() => {
    if (!chartRef.current || !containerReady) return;

    // Initialize a new instance or reuse the existing one
    let chart = chartInstanceRef.current;
    if (!chart) {
      chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      // Attach the finished event listener on first initialization
      chart.on("finished", () => {
        getImageRef.current?.(
          chart!.getDataURL({
            type: "png",
            pixelRatio: 1,
            backgroundColor: "#fff",
          })
        );
      });
    }

    // Apply the option
    chart.setOption(chartOption as ChartOptionType, true);

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Add ResizeObserver
    if (chartRef.current && !resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(chartRef.current);
    }

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [chartOption, handleResize, getImageRef, containerReady]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      // Clean up the ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      // Dispose the chart instance
      if (chartInstanceRef.current) {
        chartInstanceRef.current.off("finished");
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  function getMaxLevelCount() {
    if (!seriesData?.length) return 0;
    const level: Record<number, number> = {};
    seriesData?.forEach((v) => {
      const { level: _level } = v as unknown as { level: number };

      if (!level[_level]) {
        level[_level] = 1;
        return;
      }
      level[_level] += 1;
    });
    const max = Math.max(...Object.values(level));
    return max > 10 ? max : 10;
  }

  return (
    <div
      className={`${styles["chart-container"]} ${className ?? ""}`}
      style={style}
    >
      <div
        ref={chartRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: `${getMaxLevelCount() * 30}px`,
        }}
      />
    </div>
  );
};

export default Sankey;
