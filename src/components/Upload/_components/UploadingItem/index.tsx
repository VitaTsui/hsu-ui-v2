import React from "react";
import { UploadFile, Progress, Tooltip, Popconfirm } from "antd";
import classNames from "classnames";
import Button from "../../../Button";
import styles from "../../index.module.scss";

interface UploadingItemProps {
  file: UploadFile;
  listProps?: {
    item?: string;
    itemName?: string;
    itemProgress?: {
      hide?: boolean;
      className?: string;
    };
    itemRemove?: Partial<React.ComponentProps<typeof Button>>;
  };
  en?: boolean;
  onRemove: () => void;
}

export const UploadingItem: React.FC<UploadingItemProps> = ({
  file,
  listProps,
  en,
  onRemove,
}) => {
  const { name, url, percent } = file;

  return (
    <div className={classNames(styles.fileItem, listProps?.item)}>
      <div className={styles.uploading}>
        <Tooltip
          title={name}
          color="var(--cf-subtle)"
          styles={{
            container: { color: "var(--cf-text)", padding: "6px 16px" },
          }}
        >
          <div
            className={classNames(styles.fileName, listProps?.itemName)}
          >
            {name || url?.split("/").pop()}
          </div>
        </Tooltip>
        {!listProps?.itemProgress?.hide && (
          <Progress
            className={classNames(styles.progress, listProps?.itemProgress?.className)}
            percent={percent}
            showInfo={false}
          />
        )}
      </div>
      <Popconfirm
        placement="bottom"
        title={en ? "Are you sure you want to delete?" : "确认删除?"}
        okText={en ? "Confirm" : "确认"}
        cancelText={en ? "Cancel" : "取消"}
        onConfirm={onRemove}
      >
        <Button danger {...listProps?.itemRemove}>
          {en ? "Delete" : "删除"}
        </Button>
      </Popconfirm>
    </div>
  );
};

