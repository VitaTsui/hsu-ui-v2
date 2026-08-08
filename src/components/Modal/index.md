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

## 子组件

```tsx | pure
Modal.confirm / info / success / error / warning   // antd 的静态确认框
Modal.useModal                                     // hook 版本
Modal.destroyAll
Modal.config
```

0.1.0 之前这些没有透出，消费方只能自己去 `import { Modal } from "antd"`。

> **静态方法读不到主题。** `Modal.confirm` 这类是脱离 React 树调用的，拿不到 `ConfigProvider` 注入的 `theme.token`（antd 一贯的限制），在换过品牌色或暗色下会与页面观感不一致。要跟随主题就用 `Modal.useModal()`：
>
> ```tsx | pure
> const [modal, contextHolder] = Modal.useModal();
> // 记得把 contextHolder 渲染进树里
> return <>{contextHolder}<Button onClick={() => modal.confirm({ title: "确认？" })} /></>;
> ```

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
