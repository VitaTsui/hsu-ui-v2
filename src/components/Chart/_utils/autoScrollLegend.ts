import * as echarts from "echarts";

export interface AutoScrollLegendProps {
  chart: echarts.ECharts;
  total: number;
  visibleCount?: number;
  interval?: number;
  autoStart?: boolean;
  stopOnWheel?: boolean;
  /**
   * 是否接管滚轮翻图例，默认 true。
   * 图表自身已用滚轮平移 x 轴时传 false，避免一次滚动既翻图例又移坐标轴。
   */
  enableWheel?: boolean;
}

export function autoScrollLegend(props: AutoScrollLegendProps) {
  const {
    chart,
    total,
    visibleCount = 8,
    interval = 1500,
    autoStart = true,
    stopOnWheel = true,
    enableWheel = true,
  } = props;

  // 组件重渲染会重建滚动器，从图例当前位置接着轮播，避免每次都跳回第一项
  const legendOption = (
    chart.getOption() as { legend?: Array<{ scrollDataIndex?: number }> }
  )?.legend?.[0];
  let currentIndex = legendOption?.scrollDataIndex ?? 0;
  let scrollInterval: NodeJS.Timeout | null = null;
  let isManualScrolling = false;

  function start() {
    if (scrollInterval) {
      stop();
    }

    scrollInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex > total - visibleCount) {
        currentIndex = 0;
      }

      chart.setOption({
        legend: {
          scrollDataIndex: currentIndex,
        },
      });
    }, interval);
  }

  function stop() {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
  }

  function handleMouseOver() {
    stop();
  }

  function handleMouseOut() {
    if (!isManualScrolling) {
      start();
    }
  }

  function handleWheel(event: Event) {
    const wheelEvent = event as WheelEvent;
    wheelEvent.preventDefault();

    if (wheelEvent.deltaY > 0) {
      currentIndex++;
      if (currentIndex > total - visibleCount) {
        currentIndex = total - visibleCount;
      }
    } else {
      currentIndex--;
      if (currentIndex < 0) {
        currentIndex = 0;
      }
    }

    chart.setOption({
      legend: {
        scrollDataIndex: currentIndex,
      },
    });

    if (stopOnWheel) {
      isManualScrolling = true;
      stop();
    }
  }

  const chartDom = chart.getDom();
  chartDom.addEventListener("mouseover", handleMouseOver);
  chartDom.addEventListener("mouseout", handleMouseOut);
  if (enableWheel) {
    chartDom.addEventListener("wheel", handleWheel, { passive: false });
  }

  function dispose() {
    stop();
    chartDom.removeEventListener("mouseover", handleMouseOver);
    chartDom.removeEventListener("mouseout", handleMouseOut);
    if (enableWheel) {
      chartDom.removeEventListener("wheel", handleWheel);
    }
  }

  if (autoStart) {
    start();
  }

  return { start, stop, dispose };
}
