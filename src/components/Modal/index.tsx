import React from "react";
import { Modal as AntdModal, ModalProps as AntdModalProps } from "antd";
import styles from "./index.module.scss";
import { useModalElements, useModalDrag } from "./_hooks";
import Button, { ButtonProps } from "../Button";
import { mergeSemantic } from "../../utils/semantic";

export interface ModalProps extends AntdModalProps {
  moveable?: boolean;
  edgeDetection?: boolean;
  full?: boolean;
  titleButtonGroup?: ButtonProps[];
}

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
  } = useModalElements({ open });

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
 * antd 的静态确认框与 hook 版本原样透出，此前消费方只能自己去 import antd。
 *
 * 注意：`Modal.confirm` 这类静态方法脱离 React 树调用，读不到 `ConfigProvider` 注入的主题
 * （antd 一贯的限制）。要跟随主题就用 `Modal.useModal()` 拿 `modal` 实例并渲染它返回的
 * `contextHolder`。
 */
Modal.confirm = AntdModal.confirm;
Modal.info = AntdModal.info;
Modal.success = AntdModal.success;
Modal.error = AntdModal.error;
Modal.warning = AntdModal.warning;
Modal.useModal = AntdModal.useModal;
Modal.destroyAll = AntdModal.destroyAll;
Modal.config = AntdModal.config;

export default Modal;
