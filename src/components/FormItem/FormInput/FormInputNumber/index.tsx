import ItemContainer, { ItemContainerProps } from "../../ItemContainer";

import Input from "../../../Input";
import { InputNumberProps } from "../../../Input/Number";
import React from "react";

export interface FormInputNumberProps extends ItemContainerProps {
  /**
   * `onChange` 的签名比基础组件宽：作为**表单字段**，默认交出的是
   * `number | null`（见 Bridge 的注释）。写这个回调的人拿到的与表单拿到的
   * 是同一个值。
   */
  componentProps?: Omit<InputNumberProps, "onChange"> & {
    onChange?: (value: string | number | null) => void;
  };
  /**
   * 交给表单的是字符串而不是数字。默认 `false`。
   *
   * 只有真的要处理**超出 IEEE754 安全范围的大数**（订单号、雪花 ID）时才打开
   * —— 那种值转成 number 会丢精度，必须一路以字符串传递。
   *
   * 2.5.0 之前没有这个开关，行为固定等同于 `stringMode`（见下方 Bridge 注释）。
   */
  stringMode?: boolean;
}

// value / onChange 要重新声明：`InputNumberProps` 上那两个是**基础组件**的
// 契约（字符串进、字符串出），而这里收的是**表单值**，可以是数字或 null
type BridgeProps = Omit<InputNumberProps, "value" | "onChange"> & {
  /** antd Form.Item 注入 */
  value?: string | number | null;
  /** antd Form.Item 注入 */
  onChange?: (value: string | number | null) => void;
  /**
   * 使用方写在 `componentProps.onChange` 里的那个回调。
   *
   * 单独接出来、不跟着 `componentProps` 一起展开：展开的话它会盖掉
   * Form.Item 注入的那个 onChange，字段值就再也传不到表单里了。
   * 它拿到的与表单拿到的**是同一个值**（默认已转成数字）。
   */
  componentOnChange?: (value: string | number | null) => void;
  stringMode?: boolean;
};

/**
 * 夹在 `Form.Item` 与 `Input.Number` 之间，**把字符串换成数字再交给表单**。
 *
 * 为什么需要它：`Input.Number` 内部以字符串保存（底层 `stringMode`，为的是不
 * 丢大数精度），`onChange` 交出的也是字符串。这对一个**基础输入组件**是合理
 * 的，但对一个叫 INPUTNUMBER 的**表单字段**不合理 —— 表单收上去的值会直接
 * 进请求体，而后端字段多半是整数：
 *
 * ```
 * 422  invalid type: string "2", expected i32
 * ```
 *
 * 这个坑平时看不见：没动过的字段，值来自详情接口、本来就是数字，原样发回去
 * 没事；**只有用户真的改了那一格**才会变成字符串。现象是「我明明只改了个
 * 数字却保存失败」，而且报错在服务端，前端一行日志都没有。
 *
 * 转换只在**往上交**的方向做；`Input.Number` 内部仍然是字符串，所以正在敲的
 * "1." / "1.50" 不会被改写（配套改动见 `Input/Number` 里的 sameNumber 判断）。
 */
const Bridge: React.FC<BridgeProps> = (props) => {
  const { value, onChange, componentOnChange, stringMode, ...rest } = props;

  const emit = (next: string | number | null) => {
    onChange?.(next);
    componentOnChange?.(next);
  };

  return (
    <Input.Number
      {...rest}
      value={value}
      onChange={(text) => {
        if (stringMode) {
          emit(text);
          return;
        }

        // 空 → null 而不是 ""：语义是「没填」，不是「填了个空字符串」。
        // 后端 `Option<i32>` 收得下 null，收不下 ""
        if (text === "" || text === null || text === undefined) {
          emit(null);
          return;
        }

        const num = Number(text);
        // 转不动就原样交出去（用户可能正敲到 "-" 或 "1e" 这种中间态）。
        // 硬转成 NaN 会让表单里躺着一个既非数字也非空的值
        emit(Number.isFinite(num) ? num : text);
      }}
    />
  );
};

const FormInputNumber: React.FC<FormInputNumberProps> = (props) => {
  const {
    componentProps = {},
    className: itemClassName,
    disabled,
    stringMode,
    ...formItemProps
  } = props;
  // onChange 必须摘出来，理由见 BridgeProps.componentOnChange
  const { placeholder, onChange: componentOnChange, ...inputConfig } =
    componentProps;

  return (
    <ItemContainer {...formItemProps} className={`${itemClassName ?? ""}`}>
      <Bridge
        {...inputConfig}
        componentOnChange={componentOnChange}
        stringMode={stringMode}
        disabled={inputConfig.disabled ?? disabled}
        placeholder={placeholder ?? "请输入"}
      />
    </ItemContainer>
  );
};

export default FormInputNumber;
