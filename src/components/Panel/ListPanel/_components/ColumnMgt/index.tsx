import { mergeSemantic } from "../../../../../utils/semantic";
import { message } from "antd";
import React, { useEffect, useState } from "react";
import Table, { ColumnsType, TableDrag } from "../../../../Table";

import type { DragEndEvent } from "@dnd-kit/core";
import { IColumnMgt } from "../..";
import Input from "../../../../Input";
import { arrayMove } from "@dnd-kit/sortable";
import styles from "./index.module.scss";
import usePermissions from "../../../../../hooks/usePermissions";
import Modal, { ModalProps } from "../../../../Modal";
import Checkbox from "../../../../Checkbox";

interface DataSource {
  hidden: boolean;
  title: string;
  dataIndex: string;
  sort: number;
  width?: number;
  ellipsis?: boolean;
}

export interface ColumnMgtProps extends IColumnMgt {
  open?: boolean;
  columns?: ColumnsType;
  onOk?: (columns?: ColumnsType) => void;
  onClose?: () => void;
  className?: string;
  modalProps?: ModalProps;
  defaultColumns?: ColumnsType;
  onSelectionChange?: (
    selectedDataIndexes: string[],
    dataSource: Array<DataSource>
  ) => void;
}

const ColumnMgt: React.FC<ColumnMgtProps> = (props) => {
  const {
    open,
    className,
    columnCount = {},
    columns: dataSource,
    fixedDisplay,
    fixedPosition,
    modalProps = {},
    onOk,
    onClose,
    defaultColumns,
    onSelectionChange,
  } = props;
  const { max, min = 1 } = columnCount;
  const { classNames, ...modalConfig } = modalProps;
  const [_dataSource, setDataSource] = useState<Array<DataSource>>([]);
  const { checkPermission } = usePermissions();

  useEffect(() => {
    if (open) {
      setDataSource(
        dataSource
          ?.filter((item) => checkPermission(item.hasPermi) && item.dataIndex)
          ?.sort((a, b) => (a?.sort ?? 0) - (b?.sort ?? 0))
          ?.map(
            (item) =>
              ({
                hidden: !!item.hidden,
                title: item.title,
                dataIndex: item.dataIndex,
                sort: item.sort,
                width: item.width || "",
                ellipsis: !!item.ellipsis,
              } as DataSource)
          ) ?? []
      );
    }
  }, [dataSource, open, checkPermission]);

  const columns: ColumnsType = [
    {
      title: "显示",
      dataIndex: "hidden",
      align: "center",
      renderTitle: (title) => {
        return (
          <Checkbox
            className={styles.checkbox}
            checked={
              _dataSource.filter((item) => !item.hidden).length ===
              _dataSource.length
            }
            indeterminate={
              _dataSource.filter((item) => !item.hidden).length > 0 &&
              _dataSource.filter((item) => !item.hidden).length <
                _dataSource.length
            }
            onChange={(e) => {
              const newDataSource =
                defaultColumns?.map((item) => {
                  return {
                    ...item,
                    hidden: !e.target.checked,
                  } as DataSource;
                }) ?? [];

              setDataSource(newDataSource);
            }}
            disabled={max ? _dataSource.length !== max : false}
          >
            {title}
          </Checkbox>
        );
      },
      render: (hidden, record) => (
        <Checkbox
          checked={!hidden}
          onChange={(e) => {
            const newDataSource = _dataSource?.map((item) => {
              if (item.dataIndex === (record as DataSource).dataIndex) {
                return {
                  ...item,
                  hidden: !e.target.checked,
                };
              }

              return item;
            });

            setDataSource(newDataSource);
          }}
          disabled={
            fixedDisplay?.includes(
              (record as { dataIndex: string }).dataIndex
            ) ||
            (max &&
              _dataSource.filter((item) => !item.hidden).length >= max &&
              hidden)
          }
        />
      ),
    },
    { title: "列名", dataIndex: "title", align: "center" },
    {
      title: "宽度",
      dataIndex: "width",
      align: "center",
      width: 100,
      render: (width, record) => (
        <Input.Number
          className={styles.widthInput}
          value={width}
          onChange={(_width) => {
            const newDataSource = _dataSource?.map((item) => {
              if (item.dataIndex === (record as DataSource).dataIndex) {
                return {
                  ...item,
                  width: _width ? +_width : undefined,
                };
              }

              return item;
            });

            setDataSource(newDataSource);
          }}
          style={{ textAlign: "center" }}
        />
      ),
    },
    {
      title: "超出省略",
      dataIndex: "ellipsis",
      align: "center",
      renderTitle: (title) => {
        return (
          <Checkbox
            className={styles.checkbox}
            checked={
              _dataSource.filter((item) => item.ellipsis).length ===
              _dataSource.length
            }
            indeterminate={
              _dataSource.filter((item) => item.ellipsis).length > 0 &&
              _dataSource.filter((item) => item.ellipsis).length <
                _dataSource.length
            }
            onChange={(e) => {
              const newDataSource =
                defaultColumns?.map((item) => {
                  return {
                    ...item,
                    ellipsis: e.target.checked,
                  } as DataSource;
                }) ?? [];

              setDataSource(newDataSource);
            }}
          >
            {title}
          </Checkbox>
        );
      },
      render: (ellipsis, record) => (
        <Checkbox
          checked={ellipsis}
          onChange={(e) => {
            const newDataSource = _dataSource?.map((item) => {
              if (item.dataIndex === (record as DataSource).dataIndex) {
                return {
                  ...item,
                  ellipsis: e.target.checked,
                };
              }

              return item;
            });

            setDataSource(newDataSource);
          }}
        />
      ),
    },
    {
      title: "拖动调整顺序",
      key: "sort",
      align: "center",
      render: (record) => (
        <TableDrag.Handle
          disabled={fixedPosition?.includes(
            (record as { dataIndex: string }).dataIndex
          )}
        />
      ),
    },
  ];

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (
      (active?.id && fixedPosition?.includes(active.id.toString())) ||
      (over?.id && fixedPosition?.includes(over.id.toString()))
    ) {
      return;
    }

    if (active.id !== over?.id) {
      setDataSource((prevState) => {
        const activeIndex = prevState.findIndex(
          (record) => record.dataIndex === active?.id
        );
        const overIndex = prevState.findIndex(
          (record) => record.dataIndex === over?.id
        );
        const newDataSource = arrayMove(prevState, activeIndex, overIndex);

        // Update sort values to reflect the new order
        const updatedDataSource = newDataSource?.map((item, index) => ({
          ...item,
          sort: index,
        }));

        return updatedDataSource;
      });
    }
  };

  const reset = () => {
    const newDataSource =
      defaultColumns
        ?.filter((item) => item.dataIndex)
        ?.map(
          (item) =>
            ({
              hidden: !!item.hidden,
              title: item.title,
              dataIndex: item.dataIndex,
              sort: item.sort,
              width: item.width || "",
              ellipsis: !!item.ellipsis,
            } as DataSource)
        ) ?? [];

    setDataSource(newDataSource);
  };

  return (
    <Modal
      open={open}
      centered
      width={"40%"}
      className={`${styles.ColumnMgt} ${className ?? ""}`}
      classNames={mergeSemantic(classNames, (outer) => ({
        ...outer,
        body: `${styles.body} ${outer.body ?? ""}`,
      }))}
      title={
        <div className={styles.title}>
          <div>自定义显示列项</div>
          <div className={styles.tips}>
            列项显示不得少于{min}
            项，最多支持自定义{max ?? dataSource?.length}
            个列项，灰色选中列不支持隐藏和排序
          </div>
        </div>
      }
      footer={(originNode) => {
        return (
          <div className={styles.footer}>
            <div className={styles.left}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  reset();
                }}
              >
                恢复默认
              </a>
            </div>
            <div className={styles.originNode}>{originNode}</div>
          </div>
        );
      }}
      onOk={() => {
        const newDataSource = dataSource?.map((item) => {
          return {
            ...item,
            hidden:
              typeof _dataSource.find((i) => i.dataIndex === item.dataIndex)
                ?.hidden === "boolean"
                ? _dataSource.find((i) => i.dataIndex === item.dataIndex)
                    ?.hidden
                : item.hidden,
            sort:
              _dataSource.findIndex((i) => i.dataIndex === item.dataIndex) ===
              -1
                ? item.sort
                : _dataSource.findIndex((i) => i.dataIndex === item.dataIndex),
            width:
              _dataSource.find((i) => i.dataIndex === item.dataIndex)?.width ||
              undefined,
            ellipsis:
              typeof _dataSource.find((i) => i.dataIndex === item.dataIndex)
                ?.ellipsis === "boolean"
                ? _dataSource.find((i) => i.dataIndex === item.dataIndex)
                    ?.ellipsis
                : item.ellipsis,
          };
        });
        if (newDataSource?.length) {
          const showColumns = newDataSource.filter(
            (i) => !i.hidden && i.dataIndex
          ).length;

          if (showColumns < min) {
            return message.error(`至少选择${min}项显示列`);
          }

          if (max && showColumns > max) {
            return message.error(`最多选择${max}项显示列`);
          }

          const selectedDataIndexes = newDataSource
            .filter((item) => !item.hidden && item.dataIndex)
            ?.map((item) => item.dataIndex) as string[];
          onSelectionChange?.(selectedDataIndexes, _dataSource);
          onOk?.(newDataSource);
          onClose?.();
        }
      }}
      onCancel={onClose}
      {...modalConfig}
    >
      <Table
        onDragEnd={onDragEnd}
        columns={columns}
        dataSource={_dataSource}
        rowKey="dataIndex"
        pagination={false}
        className={styles.table}
        scroll
      />
    </Modal>
  );
};

export default ColumnMgt;
