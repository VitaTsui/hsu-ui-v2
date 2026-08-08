import React, { useContext, useMemo } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// 用本库的 Button 而不是 antd 原生的：props 类型本来就取的是本库的 ButtonProps，
// 之前混用导致 variant="surface" 这类本库扩展传不进去。
import Button, { ButtonProps } from "../../../Button";
import { CSS } from "@dnd-kit/utilities";
import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { HolderOutlined } from "@ant-design/icons";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { TableProps } from "../..";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
}

const DragHandle: React.FC<ButtonProps> = (props) => {
  const { disabled, icon, ...buttonConfig } = props;
  const { setActivatorNodeRef, listeners } = useContext(RowContext);

  return (
    <Button
      type="text"
      size="small"
      icon={icon ?? <HolderOutlined />}
      style={{ cursor: disabled ? "no-drop" : "move" }}
      disabled={disabled}
      ref={!disabled ? setActivatorNodeRef : undefined}
      {...buttonConfig}
      {...(disabled ? {} : listeners)}
    />
  );
};

const Row: React.FC<RowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners]
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

export interface DragProps {
  children: React.ReactNode;
  rowKey?: TableProps["rowKey"];
  onDragEnd?: (event: DragEndEvent) => void;
  dataSource?: TableProps["dataSource"];
}

interface DragFC extends React.FC<DragProps> {
  Handle: typeof DragHandle;
  Row: typeof Row;
}

const Drag: DragFC = (props) => {
  const { onDragEnd, rowKey = "", dataSource = [], children } = props;

  if (
    !rowKey ||
    typeof rowKey !== "string" ||
    !onDragEnd ||
    !dataSource.length
  ) {
    return <>{children}</>;
  }

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        items={dataSource?.map(
          (i) => (i as Record<string, string | number>)[rowKey]
        )}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
};

Drag.Handle = DragHandle;
Drag.Row = Row;

export default Drag;
