---
nav: 组件
group:
  title: 数据录入
  order: 3
title: Form 表单
---

# Form 表单

配置驱动的表单集合，通过 `formItems` 描述表单项，提供弹窗表单、抽屉表单、导入表单三种形态及 `useForm`。

## 引入

```ts
import { Form } from "@hsu-react/ui";
```

## 弹窗表单

`Form` 是一个命名空间对象，常用 `Form.Modal` 渲染弹窗表单，表单项通过 `formItems` 配置。点击下方按钮试试：

```tsx
import React, { useState } from "react";
import { Form } from "@hsu-react/ui";
import { Button, message } from "antd";

export default () => {
  const [open, setOpen] = useState(false);

  const formItems = [
    { type: "INPUT", name: "name", label: "姓名", required: true },
    {
      type: "SELECT",
      name: "role",
      label: "角色",
      componentProps: {
        options: [
          { label: "管理员", value: "admin" },
          { label: "访客", value: "guest" },
        ],
      },
    },
    {
      type: "INPUTNUMBER",
      name: "age",
      label: "年龄",
      componentProps: { min: 0, max: 120 },
    },
    { type: "SWITCH", name: "enabled", label: "启用" },
  ];

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        新增用户
      </Button>
      <Form.Modal
        open={open}
        title="新增用户"
        formItems={formItems}
        onOk={(data) => {
          message.success("提交数据：" + JSON.stringify(data));
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};
```

## 抽屉表单

抽屉形态的表单，用法与 `Form.Modal` 一致，通过 `formItems` 配置表单项，适合内容较多的录入场景。

```tsx
import React, { useState } from "react";
import { Form } from "@hsu-react/ui";
import { Button, message } from "antd";

export default () => {
  const [open, setOpen] = useState(false);

  const formItems = [
    { type: "INPUT", name: "name", label: "姓名", required: true },
    {
      type: "SELECT",
      name: "role",
      label: "角色",
      componentProps: {
        options: [
          { label: "管理员", value: "admin" },
          { label: "访客", value: "guest" },
        ],
      },
    },
    { type: "TEXTAREA", name: "remark", label: "备注" },
  ];

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        打开抽屉表单
      </Button>
      <Form.Drawer
        open={open}
        title="编辑用户"
        formItems={formItems}
        onClose={() => setOpen(false)}
        buttonGroup={[
          {
            title: "取消",
            onClick: () => setOpen(false),
          },
          {
            title: "确定",
            type: "primary",
            onClick: () => {
              message.success("已提交");
              setOpen(false);
            },
          },
        ]}
      />
    </>
  );
};
```

## 导入表单

导入表单，弹窗内提供文件上传，可配置上传地址 `uploadAction` 与模板下载地址 `template`。

```tsx
import React, { useState } from "react";
import { Form } from "@hsu-react/ui";
import { Button } from "antd";

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        导入数据
      </Button>
      <Form.Import
        open={open}
        title="导入数据"
        uploadAction="https://example.com/api/upload"
        templateName="导入模板.xlsx"
        onCancel={() => setOpen(false)}
      />
    </>
  );
};
```

## antd 原生成员

除了上面三个本库封装的表单形态，`Form` 还原样透出了 antd 的成员，省得再单独 `import { Form } from "antd"`：

```tsx | pure
Form.Item          // antd 的 Form.Item
Form.List
Form.ErrorList
Form.Provider
Form.useForm
Form.useWatch
Form.useFormInstance
```

> **`Form.Item` 与顶层导出的 `FormItem` 不是一个东西。** `Form.Item` 是 antd 原生的，保持 antd 语义；
> `FormItem` 是本库的增强版（label 宽度计算、tips 气泡、`hasPermi` 权限、按 `type` 自动生成 placeholder 等）。
> 刻意不让 `Form.Item` 指向增强版，否则同名不同 API，出问题时很难排查。

## API

`Form` 是一个对象，包含以下成员：

| 成员 | 说明 | 类型 |
| --- | --- | --- |
| Form.Modal | 弹窗表单 | `React.FC<ModalFormProps>` |
| Form.Drawer | 抽屉表单 | `React.FC<DrawerFormProps>` |
| Form.Import | 导入表单（上传文件） | `React.FC<ImportFormProps>` |
| Form.useForm | antd `Form.useForm`，创建表单实例 | `typeof AntdForm.useForm` |

### Form.Modal（ModalFormProps）

在 `Modal`（antd `ModalProps`，`onCancel` / `onOk` 已重写）基础上扩展：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| formItems | 表单项配置；传对象时按分组渲染 | `FormItemProps[] \| Record<string, FormItemProps[]>` | `[]` |
| extraFormItems | 额外的自定义表单项节点 | `ExtraFormItem[]` | - |
| externalForm | 外部传入的表单实例 | `FormInstance` | - |
| value | 表单回填值 | `Record<string, unknown>` | - |
| onOk | 校验通过后的提交回调 | `(data, form: FormInstance) => void` | - |
| onCancel | 取消回调 | `() => void` | - |
| hasPermi | 权限码 | `string[]` | - |
| layout / formItemLayout | 表单 / 表单项布局方向 | `'horizontal' \| 'vertical'` | - |
| columnNum | 表单列数 | `number` | - |
| disabled | 是否禁用整个表单 | `boolean` | - |
| onValuesChange | 表单值变化回调 | `(value, values) => void` | - |

### Form.Drawer（DrawerFormProps）

在 antd `DrawerProps`（`onClose` 已重写）基础上扩展：`formItems`、`extraFormItems`、`externalForm`、`value`、`hasPermi`、`buttonGroup`（底部按钮组 `ButtonProps[]`）、`onClose`、`reset`。

### Form.Import（ImportFormProps）

在 `Modal`（`onCancel` / `onOk` 已重写）基础上扩展：`open`、`title`、`onCancel`、`uploadAction`（上传地址）、`template`（模板下载地址）、`templateName`、`hasPermi`、`formClassName`、`formItemClassName`、`uploadProps`。
