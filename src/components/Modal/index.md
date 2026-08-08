---
nav: 组件
group:
  title: 反馈
  order: 5
title: Modal 对话框
---

# Modal 对话框

在 antd `Modal` 之上增强：默认垂直居中、可拖拽移动、边缘检测、一键全屏，并支持在标题区放置按钮组。

## 引入

```ts
import { Modal } from "@hsu-react/ui";
```

## 对话框

通过 `open` 受控显隐，配合 `Button` 切换状态。默认弹窗可按住标题栏拖动。

```tsx
import React, { useState } from "react";
import { Modal, Button } from "@hsu-react/ui";

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        打开对话框
      </Button>
      <Modal
        title="标题"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <p>这是一段对话框内容，可按住标题栏拖动弹窗。</p>
      </Modal>
    </>
  );
};
```

## API

在 [antd ModalProps](https://ant.design/components/modal-cn) 基础上扩展：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| moveable | 是否可拖拽标题栏移动弹窗 | `boolean` | `true` |
| edgeDetection | 拖拽时是否进行边缘检测，防止拖出视口 | `boolean` | `true` |
| full | 是否以全屏方式展示 | `boolean` | `false` |
| titleButtonGroup | 标题区右侧的按钮组配置 | `ButtonProps[]` | - |

> 其余属性（`open`、`onOk`、`onCancel`、`footer`、`width` 等）与 antd `Modal` 一致。
>
> 关闭时销毁内容默认开启。antd v6 把 `destroyOnClose` 改名为 `destroyOnHidden`，两个名字本组件都认（传了 `destroyOnHidden` 以它为准），所以 0.0.x 时期的写法不用改。
