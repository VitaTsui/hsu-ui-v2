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
import { formItemKeys } from "../_utils/formItemKey";
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
  /* `extraFormItems` 是 JSX 形态的表单项，同样可能重名（互斥字段） */
  const extraKeys = formItemKeys(
    extraFormItems?.map((i) => i.props as FormItemProps),
  );

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
          {Object.keys(_formItems ?? {})?.map((key) => {
            /* key 一次算完（重名的第二条起加 `#n`），别在 map 体里每项重算 */
            const itemKeys = formItemKeys(_formItems?.[key]);

            return (
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
                {_formItems?.[key]?.map((item, idx) => (
                  <FormItem
                    key={itemKeys[idx]}
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
            );
          })}
          {extraFormItems?.map((item, idx) => {
            item = {
              ...item,
              /* 与上面那组同一套 key 规则：重名的第二条起加 `#n`，
                 按声明顺序编号（见 formItemKeys 的说明） */
              key: extraKeys[idx],
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
