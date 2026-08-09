import { Button, UploadFile } from "antd";
import { notification } from "../../../feedback";
import FormImage, { FormImageProps } from "./FormImage";
import ItemContainer, { ItemContainerProps } from "../ItemContainer";
import Upload, {
  UploadProps as BasicUploadProps,
  UploadingList,
} from "../../Upload";

import Icon from "../../Icon";
import { RcFile } from "antd/es/upload";
import React, { useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { debounce } from "lodash";
import styles from "./index.module.scss";

export type { FormImageProps };

export interface UploadProps extends Omit<BasicUploadProps, "onChange"> {
  onChange?: (fileList?: UploadFile[]) => void;
  inline?: boolean;
  hideUpload?: boolean;
}

export interface FormUploadProps extends ItemContainerProps {
  componentProps?: UploadProps;
}

interface FormUploadFC extends React.FC<FormUploadProps> {
  Image: React.FC<FormImageProps>;
}

const FormUpload: FormUploadFC = (props) => {
  const {
    componentProps = {},
    className: itemClassName,
    name,
    disabled,
    rules,
    en: formEn,
    ...formItemProps
  } = props;
  const {
    action,
    onChange,
    beforeUpload,
    accept = "",
    drop,
    className,
    size,
    inline,
    maxCount,
    hideUpload,
    en,
    onUploadingList,
    ...uploadConfig
  } = componentProps;
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadingList, setUploadingList] = useState<UploadingList>({});

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

    setFileList(fileList);

    onChange?.(fileList);

    return fileList.length ? fileList : undefined;
  };

  const onshouldUpdate = (fileList: UploadFile[]) => {
    setFileList(fileList);

    onChange?.(fileList);
  };

  return (
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
        en: formEn,
        rules: [
          ...(rules || []),
          {
            type: "array",
            validateTrigger: "onSubmit",
            validator: () => {
              if (Object.keys(uploadingList).length) {
                return Promise.reject(
                  new Error(formEn ? "Uploading..." : "上传中...")
                );
              }
              return Promise.resolve();
            },
          },
        ],
        ...formItemProps,
      }}
      className={`${itemClassName ?? ""} ${styles.FormUpload}`}
    >
      <Upload
        {...{
          drop,
          action,
          accept,
          listType: "text",
          size,
          maxCount,
          en,
          onUploadingList: (list) => {
            setUploadingList(list);
            onUploadingList?.(list);
          },
          ...uploadConfig,
        }}
        disabled={uploadConfig.disabled ?? disabled}
        className={classNames([
          styles.upload,
          className,
          { [styles.inline]: inline && maxCount === 1 },
        ])}
      >
        {((!(uploadConfig.disabled ?? disabled) && !hideUpload) ||
          (hideUpload &&
            maxCount &&
            fileList.length < maxCount &&
            Object.keys(uploadingList).length < maxCount)) && (
          <>
            {drop ? (
              <>
                <Icon
                  icon="ic:baseline-upload-file"
                  className={styles.uploadIcon}
                />
                <div className={styles.uploadText}>
                  <div>
                    <em>{en ? "Click to upload" : "点击上传"}</em>
                    {en
                      ? ", or drag and drop files here"
                      : "，或拖放文件到此处"}
                  </div>
                  <div>
                    {`${
                      en
                        ? "Currently only supports uploading"
                        : "目前仅支持上传"
                    }${accept ? accept : "所有格式"}
                    ${en ? "file types" : "文件类型"}`}
                    {size &&
                      `${
                        en ? "and the size is less than" : "，大小不超过"
                      }${size}MB`}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button icon={<UploadOutlined />} className={styles.upBtn}>
                  {`${en ? "Supports" : "支持"} ${accept ? accept : "所有格式"}
                  ${en ? "file types" : "文件类型"}`}
                  {size &&
                    `${
                      en ? " and the size is less than" : "，大小不超过"
                    } ${size}MB`}
                </Button>
              </>
            )}
          </>
        )}
      </Upload>
    </ItemContainer>
  );
};

FormUpload.Image = FormImage;

export default FormUpload;
