import { useEffect } from "react";
import { useLocation } from "react-router";
import { useAliveController } from "react-activation";

import { TabType } from "..";

/**
 * 按业务规则在地址变化时收掉一批页签。
 *
 * 起因是消费方（writer-assistant）的一条规则：进出某部作品时，把上一部作品的所有页签
 * 一起清掉——「一次只专注一部书」。这种规则依赖业务对 URL 的解读（哪一段是作品 id），
 * 组件库不可能内建，但**收页签这件事本身**必须留在库里做：光从 openKeys 里删掉不够，
 * 还要 `drop` 掉 react-activation 的缓存，否则组件树留在内存里，下次同名路由回来还会
 * 复用旧实例。
 *
 * 所以对外只暴露一个判定函数，删除与丢缓存由这里统一执行。
 *
 * 判定按**当前地址**做，不需要消费方自己记「上一个是什么」：每次地址变化重新评估每个
 * 页签「在现在这个位置还该不该留着」，语义更直白，也不会因为漏更新 ref 而出错。
 */
export const useKeepTabs = (
  shouldKeepTab: ((tab: TabType, info: { pathname: string }) => boolean) | undefined,
  setOpenkeys: React.Dispatch<React.SetStateAction<TabType[]>>
) => {
  const { pathname } = useLocation();
  const { drop } = useAliveController();

  useEffect(() => {
    if (!shouldKeepTab) return;

    setOpenkeys((prev) => {
      const kept = prev.filter((tab) => shouldKeepTab(tab, { pathname }));
      if (kept.length === prev.length) return prev;

      prev
        .filter((tab) => !kept.includes(tab))
        // 缓存是按不带 query 的路径存的
        .forEach((tab) => drop(tab.key.split("?")[0] || ""));

      return kept;
    });
    // shouldKeepTab 多半是行内箭头函数，放进依赖会每次渲染都重跑。
    // 这个 effect 的触发时机就是「地址变了」，按 pathname 走即可。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
};
