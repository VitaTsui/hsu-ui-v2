---
nav: 组件
group:
  title: 反馈
  order: 5
title: message / notification 命令式反馈
---

# message / notification 命令式反馈

和 antd 的 `message` / `notification` **同名同签名**，区别只有一个：输出落在 `ConfigProvider` 内部，会跟随注入的主题。

## 引入

```ts
import { message, notification } from "@hsu-react/ui";
```

把原来的 `from "antd"` 改成 `from "@hsu-react/ui"` 就行，调用写法一个字都不用改：

```ts | pure
message.success("保存成功");
message.error("网络异常");
notification.warning({ message: "空间不足", description: "请清理后重试" });
```

`Modal.confirm` / `Modal.info` 这些同理，已经挂在本库的 [`Modal`](/components/modal) 上：

```ts | pure
import { Modal } from "@hsu-react/ui";

Modal.confirm({ title: "确认删除？", onOk: () => remove(id) });
```

## 为什么需要这一层

antd 的 `message.success()`、`Modal.confirm()` 是**静态方法**，调用时不在 React 树里，读不到 `ConfigProvider` 注入的 `theme.token`。结果就是：换了品牌色、切到暗色之后，页面是新的样子，弹出来的提示还是 antd 的默认观感。

antd 官方的解法是改用 hook 版本（`message.useMessage()`、`Modal.useModal()`）并把返回的 `contextHolder` 渲染进树里 —— 但那样每个调用点都得先拿到实例，命令式那种「随手一句」的写法就没了，工具函数、store、拦截器里更是拿不到。

本库的做法：`ConfigProvider` 内部挂一个 `FeedbackHolder`，它调用那三个 hook、把实例存在模块级变量里并渲染各自的 `contextHolder`；这里导出的同名函数只是代理，转发给被捕获的实例。**调用写法不变，输出却在树内。**

## 没有 ConfigProvider 时

自动回退到 antd 的静态方法：功能照常，只是不跟随主题，并在开发环境打一次提示。所以即便在 `ConfigProvider` 外（比如某个早于挂载的模块顶层）调用也不会崩。

## API

签名与 antd 完全一致，不再重复：

- [message](https://ant.design/components/message-cn) — `info` / `success` / `error` / `warning` / `loading` / `open` / `destroy`
- [notification](https://ant.design/components/notification-cn) — `success` / `error` / `info` / `warning` / `open` / `destroy`
- [Modal](https://ant.design/components/modal-cn) 的 `confirm` / `info` / `success` / `error` / `warning`，从本库的 `Modal` 上取

> `Modal.useModal()` 原样透传给 antd —— 已经在用 hook 版本的代码不受影响。
