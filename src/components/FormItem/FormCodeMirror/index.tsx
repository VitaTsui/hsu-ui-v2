import React from "react";
import { Form } from "antd";
import CodeMirror, { CodeMirrorProps } from "../../CodeMirror";
import ItemContainer, { ItemContainerProps } from "../ItemContainer";

export interface FormCodeMirrorProps extends ItemContainerProps {
  componentProps?: CodeMirrorProps;
}

// 解构默认值写成字面量会每次渲染新建一个数组，进依赖数组就让 memo 恒不命中；提到模块级常量
const EMPTY_RULES: ItemContainerProps["rules"] = [];

const FormCodeMirror: React.FC<FormCodeMirrorProps> = (props) => {
  const {
    componentProps = {},
    className: itemClassName,
    disabled,
    rules = EMPTY_RULES,
    name,
    ...formItemProps
  } = props;

  const enableLint = componentProps.enableLint !== false;
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const form = Form.useFormInstance();

  // Handle the CodeMirror error callback
  const handleError = React.useCallback(
    (error: string | null) => {
      setErrorMessage(error);

      // If there is an error, trigger form validation
      if (name && form) {
        try {
          if (error) {
            // Set the field error
            form.setFields([
              {
                name: name,
                errors: [" "],
              },
            ]);
          } else {
            // Clear the field error
            form.setFields([
              {
                name: name,
                errors: [],
              },
            ]);
          }
        } catch (e) {
          // Ignore the error; the form may not be initialized yet
        }
      }
    },
    [name, form],
  );

  // Merge validation rules; add syntax error validation only when lint is enabled
  const mergedRules = React.useMemo(() => {
    if (!enableLint) {
      return rules;
    }
    return [
      ...rules,
      {
        validator: () => {
          if (errorMessage) {
            return Promise.reject(new Error("格式错误"));
          }
          return Promise.resolve();
        },
      },
    ];
  }, [rules, errorMessage, enableLint]);

  return (
    <ItemContainer
      {...formItemProps}
      name={name}
      rules={mergedRules}
      className={`${itemClassName ?? ""}`}
    >
      <CodeMirror
        {...componentProps}
        readOnly={componentProps.readOnly ?? disabled}
        onLintError={enableLint ? handleError : undefined}
        hasError={enableLint && !!errorMessage}
      />
    </ItemContainer>
  );
};

export default FormCodeMirror;
