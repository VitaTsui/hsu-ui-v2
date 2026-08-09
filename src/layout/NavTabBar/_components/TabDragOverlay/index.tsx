import React from "react";
import { DragOverlay } from "@dnd-kit/core";
import { TabType } from "../..";
import TabLabel from "../TabLabel";
import styles from "../../index.module.scss";

interface TabDragOverlayProps {
  activeId: string | null;
  openKeys: TabType[];
  basePath: string;
  affixRouter: string[];
  open: string;
  onReload: (key: string) => void;
  refresh: (key: string) => void;
  drop: (key: string) => void;
  setOpenkeys: React.Dispatch<React.SetStateAction<TabType[]>>;
  setOpen: (key: string) => void;
  navigate: (path: string) => void;
}

/**
 * Drag overlay component that renders the tab currently being dragged
 */
const TabDragOverlay: React.FC<TabDragOverlayProps> = ({
  activeId,
  openKeys,
  basePath,
  affixRouter,
  open,
  onReload,
  refresh,
  drop,
  setOpenkeys,
  setOpen,
  navigate,
}) => {
  return (
    <DragOverlay adjustScale={false}>
      {activeId ? (
        <div className={styles.dragOverlay}>
          {(() => {
            const item = openKeys.find((item) => item.key === activeId);
            const idx = openKeys.findIndex((item) => item.key === activeId);
            return item ? (
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
              />
            ) : (
              activeId
            );
          })()}
        </div>
      ) : null}
    </DragOverlay>
  );
};

export default TabDragOverlay;
