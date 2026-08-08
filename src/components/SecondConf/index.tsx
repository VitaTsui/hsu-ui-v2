import { mergeSemantic } from "../../utils/semantic";
import { modalWidth } from "../../styles/tokens";
import React, { ReactElement, ReactNode, cloneElement, useState } from "react";
import styles from "./index.module.scss";
import Icon from "../Icon";
import Modal, { ModalProps } from "../Modal";

export interface SecondConfProps
  extends Omit<ModalProps, "title" | "children"> {
  contentTitle?: ReactNode;
  contentText?: ReactNode;
  /**
   * Trigger element (button/icon). When provided and `open` is omitted, the
   * dialog owns its open state, so the caller does not have to keep one flag
   * per confirmable action — which is otherwise impossible inside a list
   * `map()`. The child's own `onClick` still fires first, and the click stops
   * propagating so a trigger nested in a clickable row or card does not also
   * activate that row.
   */
  children?: ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
}

const SecondConf: React.FC<SecondConfProps> = (props) => {
  const {
    classNames,
    contentTitle,
    contentText,
    children,
    open,
    onOk,
    onCancel,
    ...modalConfig
  } = props;
  const [selfOpen, setSelfOpen] = useState<boolean>(false);

  // Controlled whenever `open` is supplied; self-managed only in trigger mode.
  const isControlled = open !== undefined;
  const visible = isControlled ? open : selfOpen;

  const trigger =
    children &&
    cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        children.props.onClick?.(e);
        if (!isControlled) setSelfOpen(true);
      },
    });

  const handleOk: ModalProps["onOk"] = (e) => {
    if (!isControlled) setSelfOpen(false);
    onOk?.(e);
  };

  const handleCancel: ModalProps["onCancel"] = (e) => {
    if (!isControlled) setSelfOpen(false);
    onCancel?.(e);
  };

  return (
    <>
      {trigger}
      <Modal
        width={modalWidth.md}
        {...modalConfig}
        open={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        centered
        className={styles.SecondConf}
        classNames={mergeSemantic(classNames, (outer) => ({
          ...outer,
          // `...classNames` used to be spread *after* this line, so a caller-supplied `body`
          // silently dropped `styles.body`. Merge the two instead.
          body: `${styles.body} ${outer.body || ""}`,
        }))}
        // v6 folded `maskClosable` into the `mask` config object
        mask={{ enabled: false, closable: false }}
        title=" "
      >
        <Icon icon="mingcute:question-line" className={styles.icon} />
        <div className={styles.content}>
          <div className={styles.title}>确认{contentTitle}吗？</div>
          <div className={styles.text}>{contentText}</div>
        </div>
      </Modal>
    </>
  );
};

export default SecondConf;
