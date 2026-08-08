import DrawerForm, { DrawerFormProps } from "./DrawerForm";
import ImportForm, { ImportFormProps } from "./ImportForm";
import ModalForm, { ModalFormProps } from "./ModalForm";

import { Form as AntdForm } from "antd";
import React from "react";

interface FormType {
  Modal: React.FC<ModalFormProps>;
  Drawer: React.FC<DrawerFormProps>;
  Import: React.FC<ImportFormProps>;
  /**
   * antd 的 `Form.Item`，原样透出。
   *
   * 注意与库顶层导出的 `FormItem` 区分：那个是本库自己的增强版（带 label 宽度计算、
   * tips、权限、按 type 生成 placeholder 等）。这里保持 antd 语义，避免同名不同 API。
   */
  Item: typeof AntdForm.Item;
  List: typeof AntdForm.List;
  ErrorList: typeof AntdForm.ErrorList;
  Provider: typeof AntdForm.Provider;
  useForm: typeof AntdForm.useForm;
  useWatch: typeof AntdForm.useWatch;
  useFormInstance: typeof AntdForm.useFormInstance;
}

const Form: FormType = {
  Modal: ModalForm,
  Drawer: DrawerForm,
  Import: ImportForm,
  Item: AntdForm.Item,
  List: AntdForm.List,
  ErrorList: AntdForm.ErrorList,
  Provider: AntdForm.Provider,
  useForm: AntdForm.useForm,
  useWatch: AntdForm.useWatch,
  useFormInstance: AntdForm.useFormInstance,
};

export default Form;
