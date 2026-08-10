import { Tabs as AntdTabs } from "antd";
import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";

import { RouteType } from "../types";
import styles from "./index.module.scss";
import { useAliveController } from "react-activation";
import useReload from "../_hooks/useReload";
import { formatNavTabBar } from "./_utils/formatNavTabBar";
import { useTabPath } from "./_hooks/useTabPath";
import { useTabContextMenu } from "./_hooks/useTabContextMenu";
import { useDropTabKey } from "./_hooks/useDropTabKey";
import { useTabTitle } from "./_hooks/useTabTitle";
import { useKeepTabs } from "./_hooks/useKeepTabs";
import TabLabel from "./_components/TabLabel";
import DraggableTabNode from "./_components/SortableTab";
import TabDragOverlay from "./_components/TabDragOverlay";
import { isLegacyHasSelectorBrowser } from "../../utils/cssSupports";
import Button from "../../components/Button";
import Icon from "../../components/Icon";

export interface TabType {
  label: ReactNode;
  key: string;
  element?: React.ReactNode;
  children?: TabType[];
  path?: string;
  name?: ReactNode;
  affix?: boolean;
  icon?: ReactNode;
}

export interface NavTabBarProps {
  router: RouteType[];
  affixRouter?: string[];
  basePath?: string;
  /** 页签栏最前面的「刷新当前页」按钮 */
  showReload?: boolean;
  /**
   * 地址变化时决定每个页签还留不留。返回 false 的会被关掉，并连同 react-activation 的
   * 缓存一起丢弃。
   *
   * 给的是「在当前地址下这个页签还该不该在」这种判定，不需要自己记上一个位置是什么。
   *
   * @example 一次只专注一部作品：进入另一部书时，把上一部的页签全收掉
   * ```ts
   * const workId = (p: string) => p.match(/\/work\/([0-9a-f-]{36})/)?.[1] ?? null;
   *
   * <Layout.NavTabBar
   *   shouldKeepTab={(tab, { pathname }) => {
   *     const tabWork = workId(tab.key);
   *     return !tabWork || tabWork === workId(pathname);
   *   }}
   * />
   * ```
   */
  shouldKeepTab?: (tab: TabType, info: { pathname: string }) => boolean;
}

const NavTabBar: React.FC<NavTabBarProps> = (props) => {
  const {
    router,
    affixRouter = [],
    basePath = "/",
    showReload = true,
    shouldKeepTab,
  } = props;
  const navigate = useNavigate();
  const { drop, refresh } = useAliveController();
  const onReload = useReload();
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  const items = useMemo(() => {
    return formatNavTabBar(router);
  }, [router]);

  const { tabKey, openKeys, setOpenkeys } = useTabPath({
    items,
    affixRouter,
  });

  const { open, setOpen } = useTabContextMenu();

  useDropTabKey(setOpenkeys);
  useTabTitle(setOpenkeys);
  useKeepTabs(shouldKeepTab, setOpenkeys);

  // ID of the tab currently being dragged
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure the drag sensor with a 10px activation distance to avoid accidental drags
  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });

  // Handle the drag start event
  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Handle the drag end event
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setOpenkeys((prev) => {
        const activeIndex = prev.findIndex((i) => i.key === active.id);
        const overIndex = prev.findIndex((i) => i.key === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
    setActiveId(null);
  };

  // Handle the drag cancel event
  const onDragCancel = () => {
    setActiveId(null);
  };

  /**
   * 刷新当前页。走的是和右键菜单「重新加载」完全相同的两步：`onReload` 通知页面自己重挂，
   * `refresh` 让 react-activation 丢掉这份缓存。少调其中任何一个，都会出现「看上去刷新了、
   * 实际还是那棵旧组件树」。
   *
   * key 要去掉 query —— 缓存是按路径存的，带上 `?a=1` 会找不到对应的那份。
   */
  const reloadCurrent = useCallback(() => {
    const key = tabKey?.split("?")[0];
    if (!key) return;
    onReload(key);
    refresh(key);
  }, [tabKey, onReload, refresh]);

  return (
    <AntdTabs
      className={styles.NavTabBar}
      items={openKeys?.map((item, idx) => {
        const closable = !(affixRouter.includes(item.key) || item.affix);

        return {
          label: (
            <TabLabel
              item={item}
              index={idx}
              openKeys={openKeys}
              basePath={basePath}
              affixRouter={affixRouter}
              open={open}
              onReload={onReload}
              refresh={refresh}
              drop={drop}
              setOpenkeys={setOpenkeys}
              setOpen={setOpen}
              navigate={navigate}
              className={
                legacyHasSelector && closable
                  ? styles.legacyClosableTabLabel
                  : undefined
              }
            />
          ),
          key: item.key,
          closeIcon: closable ? undefined : false,
        };
      })}
      activeKey={tabKey}
      tabBarExtraContent={
        showReload
          ? {
              left: (
                // 不加悬浮提示：图标含义直白，一颗 28px 的按钮顶出一块深色气泡反而抢眼。
                // 文案只留在 aria-label 上给读屏用。
                // 另注意不能改用 Button 的 title —— 本库的 Button 把 title 当作 children
                // 的兜底（children ?? title），传了会把文案画进按钮里
                <Button
                  className={styles.reload}
                  type="text"
                  size="small"
                  aria-label="刷新当前页"
                  icon={<Icon icon="ep:refresh" />}
                  onClick={reloadCurrent}
                />
              ),
            }
          : undefined
      }
      hideAdd
      type="editable-card"
      onEdit={(key, action) => {
        if (action === "remove") {
          drop((key as string)?.split("?")[0] || "");
          // Find the index of the tab being closed
          const currentIndex = openKeys.findIndex((item) => item.key === key);
          const newOpenKeys = openKeys.filter((item) => item.key !== key);
          setOpenkeys(newOpenKeys);
          setOpen("");
          if (key === tabKey) {
            // If the active tab is closed, select the previous tab; fall back to the first one
            const targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            navigate(newOpenKeys[targetIndex]?.key || basePath);
          }
        }
      }}
      size="small"
      renderTabBar={(tabBarProps, DefaultTabBar) => (
        <DndContext
          sensors={[sensor]}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={openKeys.map((i) => i.key)}
            strategy={horizontalListSortingStrategy}
          >
            <DefaultTabBar {...tabBarProps}>
              {(node) => (
                <DraggableTabNode {...node.props} key={node.key}>
                  {node}
                </DraggableTabNode>
              )}
            </DefaultTabBar>
          </SortableContext>
          <TabDragOverlay
            activeId={activeId}
            openKeys={openKeys}
            basePath={basePath}
            affixRouter={affixRouter}
            open={open}
            onReload={onReload}
            refresh={refresh}
            drop={drop}
            setOpenkeys={setOpenkeys}
            setOpen={setOpen}
            navigate={navigate}
          />
        </DndContext>
      )}
    />
  );
};
export default NavTabBar;
