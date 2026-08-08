import { Form, FormInstance } from "antd";
import { modalWidth } from "../../../styles/tokens";
import Modal, { ModalProps } from "../../Modal";
import FormItem, {
  PlaceholderDict,
  PlaceholderDictEn,
  FormItemProps,
} from "../../FormItem";
import React, { useEffect, useRef } from "react";

import { ItemContainerProps } from "../../FormItem/ItemContainer";
import styles from "./index.module.scss";
import usePermissions from "../../../hooks/usePermissions";
import { useFormItems } from "./_hooks/useFormItems";
import type { FormRef } from "../../../types/antd";
import { mergeSemantic } from "../../../utils/semantic";
import { useAdaptiveColumnNum } from "./_hooks/useAdaptiveColumnNum";

export type ExtraFormItem = React.ReactElement<ItemContainerProps>;

export interface ModalFormProps extends Omit<ModalProps, "onCancel" | "onOk"> {
  formItems?: FormItemProps[] | Record<string, FormItemProps[]>;
  extraFormItems?: ExtraFormItem[];
  externalForm?: FormInstance;
  onCancel?: () => void;
  onOk?: (data: Record<string, unknown>, form: FormInstance) => void;
  value?: Record<string, unknown>;
  hasPermi?: string[];
  formClassName?: string;
  formItemClassName?: string;
  layout?: "horizontal" | "vertical";
  formItemLayout?: "horizontal" | "vertical";
  columnNum?: number;
  disabled?: boolean;
  outsideChildren?: React.ReactNode;
  getFormRef?: (ref: FormRef | null) => void;
  onValuesChange?: (
    value: Record<string, unknown>,
    values: Record<string, unknown>
  ) => void;
  formItemGroupClassName?: string;
  formItemGroupTitleClassName?: string;
  formWrapperClassName?: string;
}

const ModalForm: React.FC<ModalFormProps> = (props) => {
  const {
    formItems = [],
    extraFormItems,
    externalForm,
    onCancel,
    onOk,
    className,
    classNames = {},
    value,
    open,
    hasPermi,
    formClassName,
    formItemClassName,
    children,
    layout,
    formItemLayout,
    columnNum = 2,
    disabled,
    outsideChildren,
    getFormRef,
    onValuesChange,
    formItemGroupClassName,
    formItemGroupTitleClassName,
    formWrapperClassName,
    ...modalConfig
  } = props;
  const [form] = Form.useForm(externalForm);
  const { permitted } = usePermissions(hasPermi);
  const formRef = useRef<FormRef | null>(null);
  const [formContainer, setFormContainer] =
    React.useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!value || !form || !open) return;
    form.resetFields();
    form.setFieldsValue(value);
  }, [form, value, open]);

  const _onCancel = () => {
    onCancel && onCancel();
    if (!form) return;
    form.resetFields();
  };

  const _onOk = () => {
    if (!form) return;
    form.validateFields().then((data) => {
      if (onOk) {
        onOk && onOk(data, form);
      } else {
        form.resetFields();
      }
    });
  };

  const adaptiveColumnNum = useAdaptiveColumnNum(
    formContainer,
    columnNum,
    true,
    1,
    undefined,
    1200,
    !!open
  );

  const _formItems = useFormItems(formItems, layout, adaptiveColumnNum);

  if (!permitted) {
    return null;
  }

  return (
    <Modal
      open={open}
      centered
      className={`${styles.ModalForm} ${className ?? ""} ${
        layout === "horizontal" ? styles.horizontal : ""
      }`}
      onCancel={_onCancel}
      onOk={_onOk}
      width={layout === "horizontal" ? modalWidth.lg : modalWidth.md}
      classNames={mergeSemantic(classNames, (outer) => ({
        ...outer,
        body: `${styles.body} ${outer.body ?? ""}`,
      }))}
      // v6 folded `maskClosable` into the `mask` config object
      mask={{ closable: false }}
      {...modalConfig}
    >
      <div
        ref={setFormContainer}
        className={`${styles.formWrapper} ${formWrapperClassName ?? ""}`}
      >
        <Form
          ref={(ref) => {
            formRef.current = ref;
            getFormRef?.(ref);
          }}
          form={form}
          className={`${styles.form} ${formClassName ?? ""} `}
          style={{ "--column-num": adaptiveColumnNum } as React.CSSProperties}
          onValuesChange={onValuesChange}
        >
          {Object.keys(_formItems ?? {})?.map((key) => (
            <div
              className={`${styles.formItemGroup} ${
                formItemGroupClassName ?? ""
              }`}
              key={key}
              id={key}
            >
              {key && (
                <div
                  className={`${styles.formItemTitle} ${
                    formItemGroupTitleClassName ?? ""
                  }`}
                >
                  {key}
                </div>
              )}
              <div
                className={styles.formItemGroupContent}
                style={{ paddingLeft: !key ? 0 : undefined }}
              >
                {_formItems?.[key]?.map((item) => (
                  <FormItem
                    key={item.name}
                    requiredMsg={
                      item.requiredMsg ??
                      ((item.name as string)?.endsWith("En")
                        ? `${PlaceholderDictEn[item.type]} ${item.name}`
                        : `${PlaceholderDict[item.type]}${item.label}`)
                    }
                    className={`${formItemClassName} ${item.className} ${styles.formItem}`}
                    disabled={disabled}
                    required={disabled ? false : item.required}
                    layout={formItemLayout}
                    {...item}
                  />
                ))}
              </div>
            </div>
          ))}
          {extraFormItems?.map((item) => {
            item = {
              ...item,
              key: item.props.name,
              props: {
                requiredMsg:
                  item.props.requiredMsg ??
                  (item.props.type &&
                    ((item.props.name as string)?.endsWith("En")
                      ? `${PlaceholderDictEn[item.props.type]} ${
                          item.props.name
                        }`
                      : `${PlaceholderDict[item.props.type]}${
                          item.props.label
                        }`)),
                className: `${formItemClassName} ${item.props.className} ${styles.formItem}`,
                disabled,
                required: disabled ? false : item.props.required,
                layout: formItemLayout,
                ...item.props,
              },
            };

            return item;
          })}
          {children}
        </Form>
      </div>
      {outsideChildren}
    </Modal>
  );
};

export default ModalForm;
