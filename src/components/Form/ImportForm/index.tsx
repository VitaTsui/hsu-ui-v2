import { Form, notification } from "antd";
import { modalWidth } from "../../../styles/tokens";
import FormItem, {
  PlaceholderDict,
  PlaceholderDictEn,
  FormItemProps,
} from "../../FormItem";

import React from "react";
import { UploadProps } from "../../FormItem/FormUpload";
import { downloadFile } from "hsu-utils";
import { get } from "../../../request";
import { observer } from "mobx-react-lite";
import styles from "./index.module.scss";
import useLabelWidth from "../../../hooks/useLabelWidth";
import usePermissions from "../../../hooks/usePermissions";
import Modal, { ModalProps } from "../../Modal";
import { mergeSemantic } from "../../../utils/semantic";
import { FileRes } from "../../../request";

export interface ImportFormProps extends Omit<ModalProps, "onCancel" | "onOk"> {
  open?: boolean;
  title?: string;
  onCancel?: () => void;
  uploadAction?: string;
  template?: string;
  templateName?: string;
  hasPermi?: string[];
  formClassName?: string;
  formItemClassName?: string;
  uploadProps?: UploadProps;
}

const ImportForm: React.FC<ImportFormProps> = observer((props) => {
  const {
    open,
    uploadAction,
    template,
    templateName = "",
    className,
    classNames = {},
    formClassName,
    formItemClassName,
    hasPermi,
    uploadProps,
    ...modalConfig
  } = props;
  const { permitted } = usePermissions(hasPermi);

  const onExport = () => {
    if (!template) return;
    get<FileRes>(template, { responseType: "arraybuffer" }).then((res) => {
      downloadFile(res.data.data, res.data.filename || templateName);
    });
  };

  const formItems: FormItemProps[] = [
    {
      type: "FILE",
      label: "上传文件",
      name: "file",
      extra: template ? (
        <a
          onClick={(e) => {
            e.preventDefault();
            onExport();
          }}
        >
          点击下载导入模板
        </a>
      ) : undefined,
      componentProps: {
        accept: ".xlsx",
        onUploadSuccess: () => {
          notification.success({ message: "导入成功" });
        },
        maxCount: 1,
        inline: true,
        action: uploadAction,
        showUploadList: false,
        ...uploadProps,
      },
    },
  ];

  const [labelWidth] = useLabelWidth(formItems);

  if (!permitted) {
    return null;
  }

  return (
    <Modal
      open={open}
      centered
      className={`${styles.ImportForm} ${className ?? ""}`}
      width={modalWidth.sm}
      classNames={mergeSemantic(classNames, (outer) => ({
        ...outer,
        body: `${styles.body} ${outer.body ?? ""}`,
      }))}
      // v6 folded `maskClosable` into the `mask` config object
      mask={{ closable: false }}
      footer={false}
      {...modalConfig}
    >
      <Form className={`${styles.form} ${formClassName ?? ""}`}>
        {formItems?.map((item) => (
          <FormItem
            key={item.name}
            requiredMsg={
              item.requiredMsg ??
              ((item.name as string)?.endsWith("En")
                ? `${PlaceholderDictEn[item.type]} ${item.name}`
                : `${PlaceholderDict[item.type]}${item.label}`)
            }
            labelWidth={labelWidth}
            className={`${formItemClassName} ${item.className}`}
            {...item}
          />
        ))}
      </Form>
    </Modal>
  );
});

export default ImportForm;
