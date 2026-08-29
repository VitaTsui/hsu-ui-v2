import Button, { ButtonProps } from "../../Button";
import { Drawer, DrawerProps, Form, FormInstance } from "antd";
import FormItem, {
  PlaceholderDict,
  PlaceholderDictEn,
  FormItemProps,
} from "../../FormItem";
import React, { useEffect } from "react";

import Icon from "../../Icon";
import { ItemContainerProps } from "../../FormItem/ItemContainer";
import classNames from "classnames";
import styles from "./index.module.scss";
import { formItemKeys } from "../_utils/formItemKey";
import useLabelWidth from "../../../hooks/useLabelWidth";
import usePermissions from "../../../hooks/usePermissions";
import { mergeSemantic } from "../../../utils/semantic";

export type ExtraFormItem = React.ReactElement<ItemContainerProps>;

export interface DrawerFormProps extends Omit<DrawerProps, "onClose"> {
  formItems?: FormItemProps[];
  extraFormItems?: ExtraFormItem[];
  externalForm?: FormInstance;
  value?: Record<string, unknown>;
  hasPermi?: string[];
  buttonGroup?: ButtonProps[];
  onClose?: () => void;
  reset?: boolean;
}

const DrawerForm: React.FC<DrawerFormProps> = (props) => {
  const {
    formItems,
    extraFormItems,
    externalForm,
    className,
    value,
    open,
    hasPermi,
    buttonGroup = [],
    onClose,
    reset = true,
    title,
    // Pulled out of `drawerConfig` on purpose: it is spread *after* the `classNames` prop below,
    // so leaving it in there would let a caller-supplied `classNames` replace ours wholesale
    // instead of merging with it.
    classNames: drawerClassNames,
    ...drawerConfig
  } = props;
  const [form] = Form.useForm(externalForm);
  const [labelWidth] = useLabelWidth(formItems);
  const { permitted } = usePermissions(hasPermi);

  useEffect(() => {
    if (!value || !form || !open || !reset) return;
    form.resetFields();
    form.setFieldsValue(value);
  }, [form, value, open, reset]);

  const _onClose = () => {
    onClose?.();
    if (!form || !reset) return;
    form.resetFields();
  };

  if (!permitted) {
    return null;
  }

  return (
    <Drawer
      open={open}
      className={classNames(styles.DrawerForm, className)}
      classNames={mergeSemantic(drawerClassNames, (outer) => ({
        ...outer,
        body: `${styles.body} ${outer.body ?? ""}`,
      }))}
      size={500}
      closable={false}
      title={
        <>
          {title}
          <span className={styles.close} onClick={_onClose}>
            <Icon icon="icon-park-outline:right-c" />
            收起
          </span>
        </>
      }
      {...drawerConfig}
    >
      <Form form={form} className={styles.form}>
        {formItems?.map((item, idx) => (
          <FormItem
            key={formItemKeys(formItems)[idx]}
            requiredMsg={
              (item.name as string)?.endsWith("En")
                ? `${PlaceholderDictEn[item.type]} ${item.name}`
                : `${PlaceholderDict[item.type]}${item.label}`
            }
            labelWidth={item.layout === "horizontal" ? labelWidth : undefined}
            className={classNames(styles.formItem, item.className)}
            {...item}
          />
        ))}
        {extraFormItems?.map((item) => {
          item = {
            ...item,
            key: item.props.name,
            props: {
              labelWidth:
                item.props.layout === "horizontal" ? labelWidth : undefined,
              ...item.props,
            },
          };

          return item;
        })}
      </Form>
      {buttonGroup?.length && (
        <div className={styles.btns}>
          {buttonGroup?.map((btn) => {
            return (
              <Button key={btn.title} {...btn} className={styles.btn}>
                {btn.title}
              </Button>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

export default DrawerForm;
