---
nav: 组件
group:
  title: 数据录入
  order: 3
title: FormItem 表单项
---

# FormItem 表单项

通过 `type` 字段驱动的统一表单项组件，根据类型渲染对应的输入 / 选择 / 上传等控件，需配合 antd `Form` 使用。

## 引入

```ts
import { FormItem } from "@hsu-react/ui";
```

`FormItem` 通过 `type` 指定控件类型，业务参数统一放在 `componentProps` 中，需置于 antd `Form` 之内。下面按类型分别演示：

## 输入框

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="INPUT" name="input" label="输入框" />
  </Form>
);
```

## 多行文本

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="TEXTAREA" name="textarea" label="多行文本" />
  </Form>
);
```

## 密码

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="PASSWORD" name="password" label="密码" />
  </Form>
);
```

## 密码强度

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="PASSWORDSTRENGTH" name="pwd" label="密码强度" />
  </Form>
);
```

## 数字

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem
      type="INPUTNUMBER"
      name="number"
      label="数字"
      componentProps={{ min: 0, max: 100 }}
    />
  </Form>
);
```

## 范围输入

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="RANGEINPUT" name="range" label="范围输入" />
  </Form>
);
```

## 滑块

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="SLIDER" name="slider" label="滑块" initialValue={30} />
  </Form>
);
```

## 只读文本

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem
      type="TEXT"
      name="text"
      label="只读文本"
      initialValue="只读文本内容"
    />
  </Form>
);
```

## 自定义控件

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form, Input } from "antd";

export default () => (
  <Form>
    <FormItem
      type="AUTO"
      name="auto"
      label="自定义控件"
      element={<Input placeholder="任意自定义控件" />}
    />
  </Form>
);
```

## 下拉选择

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

const options = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
];

export default () => (
  <Form>
    <FormItem
      type="SELECT"
      name="select"
      label="选择器"
      componentProps={{ options }}
    />
  </Form>
);
```

## 自动完成

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

const options = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
];

export default () => (
  <Form>
    <FormItem
      type="AUTOCOMPLETESELECT"
      name="ac"
      label="自动完成"
      componentProps={{ options }}
    />
  </Form>
);
```

## 树选择

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

const treeData = [
  {
    title: "父节点",
    value: "0",
    key: "0",
    children: [
      { title: "子节点 1", value: "0-1", key: "0-1" },
      { title: "子节点 2", value: "0-2", key: "0-2" },
    ],
  },
];

export default () => (
  <Form>
    <FormItem
      type="TREESELECT"
      name="treeSelect"
      label="树选择"
      componentProps={{ treeData }}
    />
  </Form>
);
```

## 图标选择

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="ICONSELECT" name="icon" label="图标选择" />
  </Form>
);
```

## 分段控制

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

const options = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
];

export default () => (
  <Form>
    <FormItem
      type="SEGMENTED"
      name="segmented"
      label="分段控制"
      componentProps={{ options }}
    />
  </Form>
);
```

## 单选

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

const options = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
];

export default () => (
  <Form>
    <FormItem
      type="RADIO"
      name="radio"
      label="单选"
      componentProps={{ options }}
    />
  </Form>
);
```

## 单个多选框

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="CHECKBOX" name="checkbox" label="多选框" />
  </Form>
);
```

## 多选组

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

const options = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
];

export default () => (
  <Form>
    <FormItem
      type="CHECKBOXGROUP"
      name="checkboxGroup"
      label="多选组"
      componentProps={{ options }}
    />
  </Form>
);
```

## 开关

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="SWITCH" name="switch" label="开关" />
  </Form>
);
```

## 日期选择

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="DATEPICKER" name="date" label="日期" />
  </Form>
);
```

## 日期范围

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="RANGEPICKER" name="dateRange" label="日期范围" />
  </Form>
);
```

## 步进日期

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="STEPPICKER" name="step" label="步进日期" />
  </Form>
);
```

## 树形控件

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

const treeData = [
  {
    title: "父节点",
    value: "0",
    key: "0",
    children: [
      { title: "子节点 1", value: "0-1", key: "0-1" },
      { title: "子节点 2", value: "0-2", key: "0-2" },
    ],
  },
];

export default () => (
  <Form>
    <FormItem
      type="TREE"
      name="tree"
      label="树形控件"
      componentProps={{ treeData }}
    />
  </Form>
);
```

## 富文本

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem type="EDITOR" name="editor" label="富文本" />
  </Form>
);
```

## 代码

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem
      type="CODEMIRROR"
      name="code"
      label="代码"
      componentProps={{ language: "json" }}
    />
  </Form>
);
```

## 文件上传

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem
      type="FILE"
      name="file"
      label="文件上传"
      componentProps={{ action: "/api/upload" }}
    />
  </Form>
);
```

## 图片上传

```tsx
import React from "react";
import { FormItem } from "@hsu-react/ui";
import { Form } from "antd";

export default () => (
  <Form>
    <FormItem
      type="IMAGEFILE"
      name="image"
      label="图片上传"
      componentProps={{ action: "/api/upload" }}
    />
  </Form>
);
```

## API

`FormItemProps` 是按 `type` 区分的联合类型：`{ type } & BaseFormItem & 对应控件 Props`。除 `type`、`visible` 外，其余通用属性继承自 `ItemContainerProps`（扩展自 antd `FormItemProps`），各控件的专有参数通过 `componentProps` 传入。

| 属性           | 说明                                                   | 类型                         | 默认值         |
| -------------- | ------------------------------------------------------ | ---------------------------- | -------------- |
| type           | 表单项类型，决定渲染的控件                             | `FormItemType`               | -              |
| visible        | 是否渲染该项，为 `false` 时不渲染                      | `boolean`                    | `true`         |
| name           | 字段名（antd Form 字段）                               | `NamePath`                   | -              |
| label          | 标签内容                                               | `ReactNode`                  | -              |
| componentProps | 透传给底层控件的属性（如 `options`、`placeholder` 等） | 对应控件 Props               | -              |
| labelWidth     | 标签宽度                                               | `string \| number`           | -              |
| layout         | 标签与控件的排列方向                                   | `'horizontal' \| 'vertical'` | `'horizontal'` |
| requiredMsg    | 必填校验提示文案                                       | `string`                     | -              |
| tips           | 标签旁的提示气泡（antd `TooltipProps` + 图标配置）     | `TipsProps & TooltipProps`   | -              |
| hasPermi       | 权限码；无权限时不渲染                                 | `string[]`                   | -              |
| disabled       | 是否禁用                                               | `boolean`                    | -              |
| en             | 是否使用英文占位文案                                   | `boolean`                    | -              |
| hideLabel      | 是否隐藏标签                                           | `boolean`                    | `false`        |

`type` 可选值（`FormItemType`）：

- 输入类：`AUTO`、`INPUT`、`TEXTAREA`、`PASSWORD`、`PASSWORDSTRENGTH`、`INPUTNUMBER`、`RANGEINPUT`、`SLIDER`、`EDITOR`、`CODEMIRROR`、`TEXT`
- 选择类：`SELECT`、`TREESELECT`、`AUTOCOMPLETESELECT`、`SEGMENTED`、`SWITCH`、`RADIO`、`CHECKBOX`、`CHECKBOXGROUP`、`DATEPICKER`、`RANGEPICKER`、`STEPPICKER`、`TREE`、`ICONSELECT`
- 上传类：`FILE`、`IMAGEFILE`

> 同时导出 `FormItemContainer`（即 `ItemContainer`）及类型 `FormItemType`、`FormItemProps`、`PlaceholderDict` / `PlaceholderDictEn` 占位文案字典。

### 重型字段按需加载

`EDITOR`、`CODEMIRROR`、`PASSWORDSTRENGTH` 三类字段的实现依赖体积很大的三方库
（`@wangeditor/editor` 约 814 KB、`@codemirror/*` 约 380 KB、`zxcvbn` 约 793 KB，均为未压缩）。
`FormItem` 几乎会被每个业务页面引入，若静态引入这些渲染器，那么**只要用到任何一种表单项**，
上述库就会被一并打进消费方的首屏产物。

因此这三类字段改为按需加载：只有 `type` 真的命中时才去拉对应 chunk。对使用方而言：

- **用法不变**，仍然是 `<FormItem type="EDITOR" ... />`，无需自行包 `Suspense`。
- 首次渲染这类字段时，该字段会晚一拍出现（组件内部已用 `Suspense fallback={null}` 兜住，
  不会让表单布局跳动）。antd `Form` 的值存在 store 里，字段挂载晚于 `setFieldsValue`
  也能正确回填，**不影响编辑态回显**。
- `PASSWORDSTRENGTH` 在挂载时即预取 `zxcvbn`，正常输入速度下感知不到延迟；强度条在
  加载完成前保持 0，加载失败则不显示，不阻断输入。

若消费方希望这些库进首屏（例如整站以富文本编辑为主），照常在自己的入口静态
`import Editor from "@hsu-react/ui/es/components/Editor"` 即可，两者不冲突。
