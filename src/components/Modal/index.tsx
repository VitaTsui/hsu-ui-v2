import React from "react";
import { Modal as AntdModal, ModalProps as AntdModalProps } from "antd";
import styles from "./index.module.scss";
import { useModalElements, useModalDrag } from "./_hooks";
import Button, { ButtonProps } from "../Button";
import { mergeSemantic } from "../../utils/semantic";
import { modalFuncs } from "../../feedback";
import { modalMinHeight } from "../../styles/tokens";

export interface ModalProps extends AntdModalProps {
  moveable?: boolean;
  edgeDetection?: boolean;
  full?: boolean;
  titleButtonGroup?: ButtonProps[];
  /**
   * 高度**下界**。给「内容要等接口回来才画得出」的弹窗用：不给下界的话，
   * 打开那一刻只有标题栏那么高，数据回来再撑开 —— 视觉上跳一下。
   *
   * - `true`：用标准档（`modalMinHeight`，700px），后台详情 / 列表 / 记录类弹窗都用它
   * - 数字：px；字符串：原样当 CSS 长度
   * - 不传：维持内容自适应 —— **短表单不要传**，否则平白留出一大片空白
   *
   * 它只是下界：内容更高照常撑开、照常滚动；并且在样式里与 `90vh` 取小，
   * 矮窗口下不会被顶出屏幕。
   */
  minHeight?: number | string | boolean;
}

/** `minHeight` prop → CSS 长度。`true` 走标准档，`false` / 不传等于不设下界 */
const resolveMinHeight = (
  minHeight: ModalProps["minHeight"]
): string | undefined => {
  if (minHeight === undefined || minHeight === false) return undefined;
  if (minHeight === true) return `${modalMinHeight}px`;
  return typeof minHeight === "number" ? `${minHeight}px` : minHeight;
};

interface ModalFC extends React.FC<ModalProps> {
  confirm: typeof AntdModal.confirm;
  info: typeof AntdModal.info;
  success: typeof AntdModal.success;
  error: typeof AntdModal.error;
  warning: typeof AntdModal.warning;
  useModal: typeof AntdModal.useModal;
  destroyAll: typeof AntdModal.destroyAll;
  config: typeof AntdModal.config;
}

const Modal = ((props: ModalProps) => {
  const {
    moveable = true,
    className,
    classNames,
    styles: outerStyles,
    minHeight,
    open,
    onCancel,
    onOk,
    afterClose,
    edgeDetection = true,
    full = false,
    // antd v6 renamed `destroyOnClose` to `destroyOnHidden`; keep honouring the old name so
    // existing consumers keep working, and forward the new one.
    destroyOnClose,
    destroyOnHidden = destroyOnClose ?? true,
    footer,
    title,
    titleButtonGroup,
    ...moadlConfig
  } = props;

  const {
    cls,
    modal,
    modalHeader,
    originalStyle,
    setModal,
    setModalHeader,
    setOriginalStyle,
  } = useModalElements({ open, moveable });

  useModalDrag({
    moveable,
    modal,
    modalHeader,
    open,
    edgeDetection,
  });

  const resetModal = () => {
    if (modal && originalStyle) {
      modal.setAttribute("style", originalStyle);
    }
  };

  const handleCancel = (
    e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    onCancel?.(e);
  };

  const handleOk = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOk?.(e);
  };

  const resolvedMinHeight = resolveMinHeight(minHeight);

  return (
    <AntdModal
      centered
      {...moadlConfig}
      title={
        titleButtonGroup ? (
          <>
            {title}
            <div className={styles.titleButtonGroup}>
              {titleButtonGroup?.map((button, index) => (
                <Button key={index} {...button} />
              ))}
            </div>
          </>
        ) : (
          title
        )
      }
      destroyOnHidden={destroyOnHidden}
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      className={`${styles.Modal} ${className} ${full ? styles.full : ""}`}
      classNames={mergeSemantic(classNames, (outer) => ({
        ...outer,
        header: `${cls} ${styles.header} ${outer.header ?? ""} ${
          moveable ? styles.moveable : ""
        }`,
        // v5 called this slot `content`; v6 renamed it to `container`
        container: `${styles.content} ${outer.container ?? ""}`,
        body: `${styles.body} ${outer.body ?? ""}`,
        footer: `${styles.footer} ${outer.footer ?? ""} ${
          footer === false ? styles.noFooter : ""
        }`,
      }))}
      /* 下界通过 CSS 变量交给样式表，而不是直接写 `minHeight` 内联样式：
         clamp（与 90vh 取小）必须在 CSS 里做——`min-height` 在 CSS 里赢过
         `max-height`，内联写死的话矮窗口会被顶出屏幕 */
      styles={mergeSemantic(outerStyles, (outer) => ({
        ...outer,
        container: {
          ...(outer.container ?? {}),
          ...(resolvedMinHeight
            ? ({
                "--vita-modal-min-height": resolvedMinHeight,
              } as React.CSSProperties)
            : {}),
        },
      }))}
      footer={footer}
      afterClose={() => {
        afterClose?.();
        resetModal();
        if (destroyOnHidden) {
          setModal(null);
          setModalHeader(null);
          setOriginalStyle(null);
        }
      }}
    />
  );
}) as ModalFC;

/**
 * 确认框。签名与 antd 一致，但**会跟随主题** —— 指向的是 ../feedback 里的代理，
 * 输出渲染在 ConfigProvider 内的 holder 里，而不是 antd 那个脱离 React 树的静态方法。
 * 没挂 ConfigProvider 时自动回退到 antd 静态方法（功能正常，不跟随主题）。
 */
Modal.confirm = modalFuncs.confirm;
Modal.info = modalFuncs.info;
Modal.success = modalFuncs.success;
Modal.error = modalFuncs.error;
Modal.warning = modalFuncs.warning;
Modal.useModal = AntdModal.useModal;
Modal.destroyAll = AntdModal.destroyAll;
Modal.config = AntdModal.config;

export default Modal;
