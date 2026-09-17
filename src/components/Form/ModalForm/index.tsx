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
import { isFieldValidateError } from "../../../utils/formValidateError";
import { useAdaptiveColumnNum } from "./_hooks/useAdaptiveColumnNum";

export type ExtraFormItem = React.ReactElement<ItemContainerProps>;

/**
 * 表单吐出来的那一份数据的形状。
 *
 * 默认 `Record<string, unknown>` —— 不显式传类型参数的调用方保持原样，一行都不用改。
 * 想让编译器看住「表单交给 store 那一跳」的，显式写 `<Form.Modal<XSaveData> …>`：
 * 之后 `onOk` 处理函数声明的入参形状会被逆变检查核一遍，多声明一个表单不产出的
 * 字段就地编译不过，而不是等运行时才发现键对不上。
 */
export interface ModalFormProps<Values extends object = Record<string, unknown>>
  extends Omit<ModalProps, "onCancel" | "onOk"> {
  formItems?: FormItemProps[] | Record<string, FormItemProps[]>;
  extraFormItems?: ExtraFormItem[];
  externalForm?: FormInstance;
  onCancel?: () => void;
  onOk?: (data: Values, form: FormInstance) => void;
  value?: Record<string, unknown>;
  hasPermi?: string[];
  formClassName?: string;
  formItemClassName?: string;
  /**
   * @deprecated 只是 `columnNum` 的旧写法：`"horizontal"` 等价于 `columnNum={2}`，
   * 其余取值等价于 `columnNum={1}`。分栏与否现在只看 `columnNum`，新代码直接给 `columnNum`。
   */
  layout?: "horizontal" | "vertical";
  /** 表单项内部的 label 方向，透传给每个 `FormItem` */
  formItemLayout?: "horizontal" | "vertical";
  /** 表单列数，`> 1` 即分栏（弹窗同时用宽档）。默认 1 列 */
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

const ModalForm = <Values extends object = Record<string, unknown>>(
  props: ModalFormProps<Values>
): React.ReactElement | null => {
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
    columnNum,
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
    form.validateFields().then(
      (data) => {
        if (onOk) {
          /* `validateFields()` 在 antd 这边就是 `Promise<any>`，形状的约定在
             `Values` 上，由调用方声明、由上面的逆变检查把关。 */
          onOk(data as Values, form);
        } else {
          form.resetFields();
        }
      },
      (err: unknown) => {
        /* 校验没通过：字段红字已经渲染出来，弹窗保持打开——这就是这条分支的完整处理，
           到此为止。不接住它的话浏览器会多抛一条 unhandledrejection（见
           `utils/formValidateError`）。判据是「有没有 errorFields 这个结构」，不是文案匹配。 */
        if (isFieldValidateError(err)) return;
        /* 其余异常（网络、接口、代码 bug）不归这里管，维持原样继续往上抛，
           照旧在控制台报出来，不被这层吃掉。 */
        throw err;
      }
    );
  };

  /* 分栏只有 `columnNum` 这一处判据。
     旧设计把分栏样式挂在 `layout === "horizontal"` 加的 `.horizontal` 类上，`columnNum`
     只喂给一个别处用不到的 CSS 变量 —— 于是「只给 `columnNum={2}`」的调用方静默拿到单栏，
     还没有任何提示。现在 `layout` 退成 `columnNum` 的默认值来源，不再参与判断。 */
  const _columnNum = columnNum ?? (layout === "horizontal" ? 2 : 1);
  const multiColumn = _columnNum > 1;

  const adaptiveColumnNum = useAdaptiveColumnNum(
    formContainer,
    _columnNum,
    true,
    1,
    undefined,
    1200,
    !!open
  );

  const _formItems = useFormItems(formItems, multiColumn, adaptiveColumnNum);
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
        multiColumn ? styles.multiColumn : ""
      }`}
      onCancel={_onCancel}
      onOk={_onOk}
      /* 宽度按**传进来的**列数选档，不能用 `adaptiveColumnNum`：
         后者由容器宽度算出来，再拿它反过来定弹窗宽度就成了闭环，会来回抖。 */
      width={multiColumn ? modalWidth.lg : modalWidth.md}
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
