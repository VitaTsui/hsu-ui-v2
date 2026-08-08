import React from "react";
import { UploadFile, Tooltip, Popconfirm } from "antd";
import classNames from "classnames";
import Button from "../../../Button";
import { downloadFile } from "hsu-utils";
import { deepCopy } from "hsu-utils";
import { FilePreviewTypeArr } from "../../../FilePreview";
import styles from "../../index.module.scss";
import { UploadProps } from "../..";

interface UploadedItemProps {
  file: UploadFile;
  listProps?: UploadProps["listProps"];
  en?: boolean;
  disabled?: boolean;
  downloading: Record<string, AbortController>;
  setDownloading: (downloading: Record<string, AbortController>) => void;
  onPreview?: (file: UploadFile) => void;
  onDownload?: (file: UploadFile) => void;
  onRemove: () => void;
  onPreviewClick: (info: {
    fileUrl?: string;
    fileType?: string;
    fileName?: string;
  }) => void;
}

export const UploadedItem: React.FC<UploadedItemProps> = ({
  file,
  listProps,
  en,
  disabled,
  downloading,
  setDownloading,
  onPreview,
  onDownload,
  onRemove,
  onPreviewClick,
}) => {
  const { name, url } = file;
  const fileType = (name ?? url)?.split(".").pop()?.toLowerCase();

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    } else {
      const controller = new AbortController();
      const signal = controller.signal;

      setDownloading(
        deepCopy({
          ...downloading,
          [file.uid]: controller,
        }),
      );

      downloadFile(
        listProps?.itemDownload?.formatUrl?.(file) ||
          listProps?.formatUrl?.(file) ||
          url ||
          "",
        name || "",
        signal,
      ).then(() => {
        delete downloading[file.uid];
        setDownloading(deepCopy(downloading));
      });
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(file);
    } else {
      const formatInfo = listProps?.itemPreview?.formatInfo?.(file);
      onPreviewClick({
        fileUrl: formatInfo?.fileUrl || listProps?.formatUrl?.(file) || url,
        fileType: formatInfo?.fileType || fileType,
        fileName: formatInfo?.fileName || name,
      });
    }
  };

  const handleRemove = () => {
    onRemove();
    if (downloading[file.uid]) {
      downloading[file.uid].abort();
      delete downloading[file.uid];
      setDownloading(deepCopy(downloading));
    }
  };

  return (
    <div className={classNames(styles.fileItem, listProps?.item)}>
      <Tooltip
        title={name}
        color="var(--cf-subtle)"
        styles={{
          container: { color: "var(--cf-text)", padding: "6px 16px" },
        }}
      >
        <div className={classNames(styles.fileName, listProps?.itemName)}>
          {name || url?.split("/").pop()}
        </div>
      </Tooltip>
      {((fileType && FilePreviewTypeArr.includes(fileType)) || onPreview) && (
        <Button {...listProps?.itemPreview} onClick={handlePreview}>
          {en ? "Preview" : "预览"}
        </Button>
      )}
      <Button
        onClick={handleDownload}
        disabled={!!downloading[file.uid]}
        {...listProps?.itemDownload}
      >
        {en
          ? downloading[file.uid]
            ? "Downloading..."
            : "Download"
          : downloading[file.uid]
            ? "下载中..."
            : "下载"}
      </Button>
      {!disabled && (
        <Popconfirm
          placement="bottom"
          title={en ? "Are you sure you want to delete?" : "确认删除?"}
          okText={en ? "Confirm" : "确认"}
          cancelText={en ? "Cancel" : "取消"}
          onConfirm={handleRemove}
        >
          <Button danger {...listProps?.itemRemove}>
            {en ? "Delete" : "删除"}
          </Button>
        </Popconfirm>
      )}
    </div>
  );
};
