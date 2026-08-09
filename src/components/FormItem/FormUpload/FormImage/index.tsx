import { UploadFile } from "antd";
import { notification } from "../../../../feedback";
import ItemContainer, { ItemContainerProps } from "../../ItemContainer";
import React, { ReactNode, useState } from "react";
import Upload, { UploadProps as BasicUploadProps } from "../../../Upload";

import { PlusOutlined } from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import FilePreview from "../../../FilePreview";
import { debounce } from "lodash";
import { downloadFile } from "hsu-utils";

interface UploadProps extends Omit<BasicUploadProps, "onChange"> {
  onChange?: (fileList: UploadFile[]) => void;
  children?: ReactNode;
}

export interface FormImageProps extends ItemContainerProps {
  componentProps?: UploadProps;
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const FormImage: React.FC<FormImageProps> = (props) => {
  const {
    componentProps = {},
    className: itemClassName,
    disabled,
    name,
    ...formItemProps
  } = props;
  const {
    action,
    onChange,
    beforeUpload,
    children,
    size,
    accept = ".jpg,.png,.jpeg",
    maxCount,
    fileList: _fileList,
    en,
    ...uploadConfig
  } = componentProps;
  const [previewImage, setPreviewImage] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>(_fileList ?? []);

  const getValueFromEvent = ({
    fileList,
  }: {
    file: RcFile;
    fileList: RcFile[];
  }) => {
    fileList?.forEach((file: UploadFile, index: number) => {
      if (file.status === "error") {
        !beforeUpload &&
          notification.error({
            message: file.error?.message || (en ? "Upload failed" : "上传失败"),
          });
        fileList.splice(index, 1);
      } else if (file.response) {
        if (
          file.response?.code !== 0 &&
          file.response?.code !== 200 &&
          file.response?.code !== undefined
        ) {
          notification.error({
            message: file.response.msg,
          });
          fileList.splice(index, 1);
        }
      }
    });

    fileList.forEach((file: UploadFile) => {
      if (file.url) {
        file.thumbUrl = uploadConfig.listProps?.formatUrl?.(file) || file.url;
      }
    });

    setFileList(fileList);

    onChange?.(fileList);

    return fileList.length ? fileList : undefined;
  };

  const onshouldUpdate = (fileList: UploadFile[]) => {
    onChange?.(fileList);
  };

  return (
    <>
      <ItemContainer
        {...{
          name,
          valuePropName: "fileList",
          getValueFromEvent,
          shouldUpdate: (_, curValue) => {
            debounce(() => {
              onshouldUpdate([...(curValue[name] || [])]);
            })();

            return false;
          },
          ...formItemProps,
        }}
        className={`${itemClassName ?? ""}`}
      >
        <Upload
          {...{
            ...uploadConfig,
            action,
            accept,
            listType: "picture-card",
            onPreview: async (file: UploadFile) => {
              if (!file.url && !file.preview) {
                file.preview = await getBase64(file.originFileObj as RcFile);
              }

              setPreviewImage(
                file.url
                  ? uploadConfig.listProps?.formatUrl?.(file) || file.url
                  : (file.preview as string),
              );
            },
            onDownload: async (file: UploadFile) => {
              if (!file.url && !file.preview) {
                file.preview = await getBase64(file.originFileObj as RcFile);
              }
              downloadFile(
                uploadConfig.listProps?.formatUrl?.(file) || file.url || "",
                file.name,
              );
            },
            showUploadList: { showDownloadIcon: true },
            size,
            maxCount,
            en,
          }}
          disabled={uploadConfig.disabled ?? disabled}
        >
          {(!(uploadConfig.disabled ?? disabled) ||
            (maxCount && fileList.length < maxCount)) && (
            <>
              {children ?? (
                <div className="formItem-upload-picture-add">
                  <PlusOutlined />
                </div>
              )}
            </>
          )}
        </Upload>
      </ItemContainer>
      <FilePreview
        fileType={previewImage.split(".").pop()?.toLowerCase()}
        fileUrl={previewImage}
        open={!!previewImage}
        onClose={() => setPreviewImage("")}
      />
    </>
  );
};

export default FormImage;
