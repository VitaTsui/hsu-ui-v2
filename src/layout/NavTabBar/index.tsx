import { Tabs as AntdTabs } from "antd";
import React, { ReactNode, useMemo, useState } from "react";
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
import TabLabel from "./_components/TabLabel";
import DraggableTabNode from "./_components/SortableTab";
import TabDragOverlay from "./_components/TabDragOverlay";
import { isLegacyHasSelectorBrowser } from "../../utils/cssSupports";

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
}

const NavTabBar: React.FC<NavTabBarProps> = (props) => {
  const { router, affixRouter = [], basePath = "/" } = props;
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
