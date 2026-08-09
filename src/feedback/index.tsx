import React, { useMemo } from "react";
import {
  Modal as AntdModal,
  message as antdMessage,
  notification as antdNotification,
} from "antd";
import type { HookAPI as ModalHookApi } from "antd/es/modal/useModal";
import type { MessageInstance } from "antd/es/message/interface";
import type { NotificationInstance } from "antd/es/notification/interface";

/**
 * 主题化的 message / notification / modal。
 *
 * 问题：antd 的 `message.success()`、`Modal.confirm()` 这类是命令式静态方法，调用时不在
 * React 树里，读不到 `ConfigProvider` 注入的 `theme.token` —— 换过品牌色或切到暗色之后，
 * 弹出来的东西还是 antd 的默认观感，与页面割裂。antd 官方的答案是改用 hook 版本
 * （`Modal.useModal()` 等）并把返回的 contextHolder 渲染进树里，但那样每个调用点都得先拿
 * 到实例，命令式的写法就没了。
 *
 * 这里的做法：`ConfigProvider` 内部挂一个 `FeedbackHolder`，它调用那三个 hook，把拿到的
 * 实例存到模块级变量，并渲染各自的 contextHolder。下面导出的同名函数只是代理，转发给
 * 被捕获的实例。于是调用写法不变，输出却在树内、能读到主题。
 *
 * 没挂 `ConfigProvider` 时回退到 antd 的静态方法：功能照常，只是不跟随主题，
 * 并在开发环境提示一次。
 */

let modalInstance: ModalHookApi | null = null;
let messageInstance: MessageInstance | null = null;
let notificationInstance: NotificationInstance | null = null;

let warned = false;
const warnOnce = (name: string) => {
  if (warned || process.env.NODE_ENV === "production") return;
  warned = true;
  console.warn(
    `[@hsu-react/ui] ${name} 在 <ConfigProvider> 之外被调用，已回退到 antd 的静态方法。` +
      `功能正常，但不会跟随 ConfigProvider 注入的主题（品牌色、暗色等）。` +
      `把应用包在 <ConfigProvider> 里即可。`
  );
};

/**
 * 捕获三个 hook 实例并渲染它们的 contextHolder。由 `ConfigProvider` 内部渲染，
 * 消费方不需要自己挂。
 */
export const FeedbackHolder: React.FC = () => {
  const [modalApi, modalHolder] = AntdModal.useModal();
  const [messageApi, messageHolder] = antdMessage.useMessage();
  const [notificationApi, notificationHolder] =
    antdNotification.useNotification();

  // 同步赋值而不是放进 useEffect：子树里如果有组件在自己的 effect 里就弹提示，
  // effect 的执行顺序是自下而上的，等到这里的 effect 跑完就已经晚了。
  useMemo(() => {
    modalInstance = modalApi;
    messageInstance = messageApi;
    notificationInstance = notificationApi;
  }, [modalApi, messageApi, notificationApi]);

  return (
    <>
      {modalHolder}
      {messageHolder}
      {notificationHolder}
    </>
  );
};

/** 仅供测试 / 卸载时清理 */
export const resetFeedbackInstances = () => {
  modalInstance = null;
  messageInstance = null;
  notificationInstance = null;
};

type MessageKey = keyof MessageInstance;
type NotificationKey = keyof NotificationInstance;
type ModalKey = keyof ModalHookApi;

const proxyMessage = <K extends MessageKey>(key: K): MessageInstance[K] =>
  ((...args: unknown[]) => {
    const api = messageInstance;
    if (!api) warnOnce("message");
    return (
      (api ?? antdMessage)[key] as unknown as (...a: unknown[]) => unknown
    )(...args);
  }) as MessageInstance[K];

const proxyNotification = <K extends NotificationKey>(
  key: K
): NotificationInstance[K] =>
  ((...args: unknown[]) => {
    const api = notificationInstance;
    if (!api) warnOnce("notification");
    return (
      (api ?? antdNotification)[key] as unknown as (...a: unknown[]) => unknown
    )(...args);
  }) as NotificationInstance[K];

const proxyModal = <K extends ModalKey>(key: K): ModalHookApi[K] =>
  ((...args: unknown[]) => {
    const api = modalInstance;
    if (!api) warnOnce("Modal");
    return (
      (api ?? AntdModal)[key] as unknown as (...a: unknown[]) => unknown
    )(...args);
  }) as ModalHookApi[K];

/**
 * 与 antd 的 `message` 同名同签名，区别是输出在 React 树内，会跟随主题。
 * 直接把 `import { message } from "antd"` 换成从本库引入即可。
 */
export const message: MessageInstance = {
  info: proxyMessage("info"),
  success: proxyMessage("success"),
  error: proxyMessage("error"),
  warning: proxyMessage("warning"),
  loading: proxyMessage("loading"),
  open: proxyMessage("open"),
  destroy: proxyMessage("destroy"),
};

/** 与 antd 的 `notification` 同名同签名，输出跟随主题 */
export const notification: NotificationInstance = {
  success: proxyNotification("success"),
  error: proxyNotification("error"),
  info: proxyNotification("info"),
  warning: proxyNotification("warning"),
  open: proxyNotification("open"),
  destroy: proxyNotification("destroy"),
};

/** 与 antd 的 `Modal.confirm` 等同名同签名，输出跟随主题 */
export const modalFuncs: ModalHookApi = {
  info: proxyModal("info"),
  success: proxyModal("success"),
  error: proxyModal("error"),
  warning: proxyModal("warning"),
  confirm: proxyModal("confirm"),
};
