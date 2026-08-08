import {
  Upload as AntdUpload,
  UploadProps as AntdUploadProps,
  UploadFile,
} from "antd";
import type { UploadRequestOption } from "../../types/antd";
import React, { useCallback } from "react";
import { Canceler } from "axios";
import { RcFile } from "antd/es/upload";
import { deepCopy } from "hsu-utils";
import styles from "./index.module.scss";
import classNames from "classnames";
import { ButtonProps, ProgressProps } from "antd";
import FilePreview, { FilePreviewType } from "../FilePreview";
import {
  useUploadFileList,
  useUploadOperations,
  useUploadPreview,
} from "./_hooks";
import { chunkUpload, normalUpload } from "./_utils";
import { UploadingItem } from "./_components/UploadingItem";
import { UploadedItem } from "./_components/UploadedItem";

export type UploadingList = Record<string, Canceler[]>;

export interface UploadProps extends Omit<AntdUploadProps, "action" | "data"> {
  drop?: true;
  onUploading?: (fileList: UploadFile[]) => void;
  action?: string;
  chunkAction?: string;
  mergeChunkAction?: string;
  chunkNum?: number;
  data?: Partial<Record<string, string>>;
  sharding?: boolean;
  size?: number;
  onUploadingList?: (list: Record<string, Canceler[]>) => void;
  rmFile?: string;
  onUploadSuccess?: () => void;
  listProps?: {
    item?: string;
    itemName?: string;
    itemProgress?: ProgressProps & {
      hide?: boolean;
    };
    itemRemove?: ButtonProps;
    formatUrl?: (file: UploadFile) => string;
    itemDownload?: ButtonProps & {
      formatUrl?: (file: UploadFile) => string;
    };
    itemPreview?: ButtonProps & {
      formatInfo?: (file: UploadFile) => {
        fileUrl?: string;
        fileType?: FilePreviewType;
        fileName?: string;
      };
    };
  };
  en?: boolean;
}

interface UploadFC extends React.FC<UploadProps> {
  /** antd 的拖拽上传区 */
  Dragger: typeof AntdUpload.Dragger;
  /** `beforeUpload` 返回它表示「跳过这个文件且不进 fileList」 */
  LIST_IGNORE: typeof AntdUpload.LIST_IGNORE;
}

const Upload = ((props: UploadProps) => {
  const {
    disabled = false,
    drop,
    onChange,
    fileList = [],
    onUploading,
    action,
    chunkAction,
    mergeChunkAction,
    chunkNum = 3,
    data,
    sharding,
    size,
    accept = "",
    onUploadingList,
    rmFile,
    onUploadSuccess,
    className,
    headers,
    listProps,
    listType,
    en,
    onDownload,
    onPreview,
    ...uploadConfig
  } = props;

  // antd v6 widened `accept` to `string | { format: string; filter?: ... }`. This component's own
  // extension check (validateFile) only understands the comma-separated string, so read the format
  // out of the object form; antd still applies the full config to the native file input.
  const acceptFormat = typeof accept === "string" ? accept : accept.format;

  const {
    fileList: _fileList,
    setFileList,
    onChange: handleFileListChange,
  } = useUploadFileList({
    fileList,
    onChange,
    rmFile,
  });

  const { uploadingList, setUploadingList, downloading, setDownloading } =
    useUploadOperations({
      onUploadingList,
    });

  const {
    file: previewFile,
    open: previewOpen,
    setFile: setPreviewFile,
  } = useUploadPreview();

  // Chunked upload
  const chunkCustomRequest: AntdUploadProps["customRequest"] = useCallback(
    async (options: UploadRequestOption) => {
      const { file: _file, onSuccess, onError, onProgress } = options;
      if (typeof _file === "string" || !chunkAction || !mergeChunkAction) {
        return;
      }

      const file = new File(
        [_file],
        encodeURIComponent((_file as RcFile).name),
        {
          type: (_file as RcFile).type,
        }
      ) as RcFile;
      file.uid = (_file as RcFile).uid;

      await chunkUpload({
        file,
        chunkAction,
        mergeChunkAction,
        chunkNum,
        data,
        headers,
        accept: acceptFormat,
        size,
        en,
        uploadingList,
        setUploadingList,
        onProgress,
        onSuccess,
        onError,
        onUploadSuccess,
      });
    },
    [
      chunkAction,
      mergeChunkAction,
      chunkNum,
      data,
      headers,
      acceptFormat,
      size,
      en,
      uploadingList,
      setUploadingList,
      onUploadSuccess,
    ]
  );

  // Normal upload
  const customRequest: AntdUploadProps["customRequest"] = useCallback(
    async (options: UploadRequestOption) => {
      const { file: _file, onSuccess, onError, onProgress } = options;
      if (typeof _file === "string" || !action) {
        onError?.(new Error("没有上传地址"));
        return;
      }

      const file = new File(
        [_file],
        encodeURIComponent((_file as RcFile).name),
        {
          type: (_file as RcFile).type,
        }
      ) as RcFile;
      file.uid = (_file as RcFile).uid;

      await normalUpload({
        file,
        action,
        data,
        headers,
        accept: acceptFormat,
        size,
        en,
        uploadingList,
        setUploadingList,
        onProgress,
        onSuccess,
        onError,
        onUploadSuccess,
      });
    },
    [
      action,
      data,
      headers,
      acceptFormat,
      size,
      en,
      uploadingList,
      setUploadingList,
      onUploadSuccess,
    ]
  );

  const handleChange = ({
    file,
    fileList: newFileList,
  }: {
    file: UploadFile;
    fileList: UploadFile[];
  }) => {
    handleFileListChange({ file, fileList: newFileList });

    const uploading = newFileList.filter((item) => item.status === "uploading");
    onUploading?.(uploading);
  };

  const handleRemove = useCallback(
    (file: UploadFile) => {
      if (uploadingList[file.uid]) {
        uploadingList[file.uid]?.forEach((c) => c());
        delete uploadingList[file.uid];
        setUploadingList(deepCopy(uploadingList));
      }

      const filteredList = _fileList.filter((item) => item.uid !== file.uid);
      setFileList(filteredList);
      onChange?.({
        file,
        fileList: filteredList,
      });
    },
    [uploadingList, setUploadingList, _fileList, setFileList, onChange]
  );

  const Upload = drop ? AntdUpload.Dragger : AntdUpload;

  return (
    <>
      <Upload
        disabled={disabled}
        className={classNames(styles.Upload, className)}
        customRequest={sharding ? chunkCustomRequest : customRequest}
        fileList={
          Array.isArray(_fileList)
            ? _fileList.filter((item) => item.status !== "error")
            : undefined
        }
        onChange={handleChange}
        accept={accept}
        onRemove={handleRemove}
        listType={listType}
        onDownload={onDownload}
        onPreview={onPreview}
        itemRender={
          listType === "picture-card"
            ? undefined
            : (_, file, __, { remove }) => {
                if (file.status === "removed") {
                  return null;
                }

                if (file.status === "uploading") {
                  return (
                    <UploadingItem
                      file={file}
                      listProps={listProps}
                      en={en}
                      onRemove={remove}
                    />
                  );
                }

                return (
                  <UploadedItem
                    file={file}
                    listProps={listProps}
                    en={en}
                    disabled={disabled}
                    downloading={downloading}
                    setDownloading={setDownloading}
                    onPreview={onPreview}
                    onDownload={onDownload}
                    onRemove={remove}
                    onPreviewClick={(info) => {
                      setPreviewFile(info);
                    }}
                  />
                );
              }
        }
        {...uploadConfig}
      />

      <FilePreview
        {...previewFile}
        open={previewOpen}
        onClose={() => setPreviewFile({})}
      />
    </>
  );
}) as UploadFC;

Upload.Dragger = AntdUpload.Dragger;
Upload.LIST_IGNORE = AntdUpload.LIST_IGNORE;

export default Upload;
