import Input, { InputProps as BasicInputProps } from "../../../Input";
import ItemContainer, { ItemContainerProps } from "../../ItemContainer";
import React, { useEffect, useRef, useState } from "react";

import styles from "./index.module.scss";

interface InputProps extends BasicInputProps {}

export interface FormPasswordStrengthProps extends ItemContainerProps {
  componentProps?: InputProps;
}

/**
 * zxcvbn 约 793 KB（未压缩），却只在这一个字段的 onChange 里用来算强度分。
 * 静态 import 会让它跟着 FormInput → FormItem 进入每个引入过表单项的页面的
 * 首屏 chunk。改成动态 import：只有真的渲染了 PASSWORDSTRENGTH 字段才去拉。
 *
 * 模块级缓存 Promise，多个密码框共用一次加载；失败时清掉缓存，下次重试。
 */
type Zxcvbn = typeof import("zxcvbn");

let zxcvbnPromise: Promise<Zxcvbn> | undefined;
const loadZxcvbn = (): Promise<Zxcvbn> => {
  if (!zxcvbnPromise) {
    zxcvbnPromise = import("zxcvbn")
      .then((mod) => {
        // zxcvbn 是 `export =` 的 CJS 模块：不同打包器/interop 下动态 import 拿到的
        // 可能是函数本身，也可能是 { default: 函数 }，两种都要兼容
        const m = mod as Zxcvbn & { default?: Zxcvbn };
        return m.default ?? m;
      })
      .catch((err) => {
        zxcvbnPromise = undefined;
        throw err;
      });
  }
  return zxcvbnPromise;
};

const PasswordStrength: React.FC<InputProps> = (props) => {
  const { placeholder, onChange, ...inputConfig } = props;
  const [fraction, setFraction] = useState<number>(0);
  // 挂载即预取：chunk 仍是独立的，但用户敲第一个字符时通常已经就绪
  useEffect(() => {
    loadZxcvbn().catch(() => undefined);
  }, []);

  // 打字比加载快时会有多次并发计算，迟到的结果不能盖掉最新一次
  const seqRef = useRef(0);

  return (
    <div className={styles.passwordStrength}>
      <Input.Password
        {...inputConfig}
        placeholder={placeholder ?? "请输入"}
        onChange={(value) => {
          onChange && onChange(value);

          const seq = ++seqRef.current;
          loadZxcvbn()
            .then((zxcvbn) => {
              if (seq !== seqRef.current) return;
              setFraction(zxcvbn(value).guesses_log10);
            })
            // 强度条只是辅助提示，拉不到就不显示，不打断用户输入
            .catch(() => undefined);
        }}
        allowClear
        autoComplete="new-password"
      />
      <meter
        min={0}
        max={12}
        low={4}
        high={8}
        optimum={10}
        value={fraction}
        className={styles.strengthBar}
      />
    </div>
  );
};

const FormPasswordStrength: React.FC<FormPasswordStrengthProps> = (props) => {
  const {
    componentProps = {},
    className: itemClassName,
    disabled,
    ...formItemProps
  } = props;

  return (
    <ItemContainer {...formItemProps} className={`${itemClassName ?? ""}`}>
      <PasswordStrength
        {...componentProps}
        disabled={componentProps.disabled ?? disabled}
      />
    </ItemContainer>
  );
};

export default FormPasswordStrength;
