import Button, { ButtonProps } from "../Button";
import { FormOutlined, DeleteOutlined } from "@ant-design/icons";
import { Dropdown, Popconfirm, PopconfirmProps } from "antd";
import React, { ReactNode, useCallback, useMemo } from "react";
import { ItemType } from "antd/es/menu/interface";
import styles from "./index.module.scss";
import usePermissions from "../../hooks/usePermissions";
import Icon from "../Icon";
import useOperateEllipsis from "./_hooks/useOperateEllipsis";
import classNames from "classnames";
import moreImg from "./more.png";

export interface OperateProps
  extends Omit<ButtonProps, "children" | "title" | "onClick" | "hasPermi"> {
  title?: ReactNode;
  menu?: OperateProps[];
  onClick?: () => void;
  onConfirm?: () => void;
  icon?: ReactNode | false;
  delete?: boolean;
  popconfirm?: Omit<PopconfirmProps, "title"> & {
    title?: ReactNode;
  };
  hidden?: boolean;
  hasPermi?: string[];
  maxVisible?: number;
  enableEllipsis?: boolean;
  moreIcon?: ReactNode | false;
}

/**
 * Render an icon
 * @param icon - Icon configuration
 * @param defaultIcon - Default icon
 * @returns The rendered icon element
 */
const renderIcon = (
  icon: ReactNode | false | undefined,
  defaultIcon: ReactNode
): ReactNode | null => {
  if (icon === false) return null;
  if (icon) {
    return typeof icon === "string" ? <Icon icon={icon} /> : icon;
  }
  return defaultIcon;
};

/**
 * Handler that stops event propagation
 */
const stopPropagation = (e?: React.MouseEvent) => {
  e?.stopPropagation();
};

const Operate: React.FC<OperateProps> = (props) => {
  const {
    title,
    className,
    menu = [],
    icon,
    delete: isDelete,
    popconfirm,
    hidden,
    onClick,
    onConfirm,
    hasPermi,
    maxVisible = 3,
    enableEllipsis = true,
    moreIcon,
    ...config
  } = props;
  const { checkPermission } = usePermissions();

  // Filter menu items (by permission and hidden state)
  const filteredMenu = useMemo(() => {
    return menu.filter(
      (item) => !item.hidden && checkPermission(item.hasPermi)
    ) as OperateProps[];
  }, [menu, checkPermission]);

  // Determine whether it overflows
  const isOverflow = useOperateEllipsis(
    filteredMenu,
    maxVisible,
    enableEllipsis
  );

  // Compute the visible and hidden menu items
  const { visibleItems, hiddenItems } = useMemo(() => {
    if (!isOverflow || maxVisible === undefined) {
      return { visibleItems: filteredMenu, hiddenItems: [] };
    }
    return {
      visibleItems: filteredMenu.slice(0, maxVisible),
      hiddenItems: filteredMenu.slice(maxVisible),
    };
  }, [filteredMenu, isOverflow, maxVisible]);

  // Handle the confirm event
  const handleConfirm = useCallback(
    (e?: React.MouseEvent) => {
      stopPropagation(e);
      onConfirm?.() ?? onClick?.();
    },
    [onConfirm, onClick]
  );

  // Handle the confirm event for a menu item
  const handleMenuItemConfirm = useCallback(
    (item: OperateProps) => (e?: React.MouseEvent) => {
      stopPropagation(e);
      item.onConfirm?.() ?? item.onClick?.();
    },
    []
  );

  if (hidden) return null;

  // Common configuration for rendering the button
  const buttonClassName = `${styles.Operate} ${className ?? ""}`.trim();

  // Prepare props to pass to Button (exclude hasPermi, since Button does not support the false type)
  const buttonProps = {
    ...config,
    ...(hasPermi?.length ? { hasPermi } : {}),
  };

  // If there is a menu, render multiple operate buttons
  if (menu.length > 0) {
    // Generate dropdown menu items (for the "more" button)
    const menuItems: ItemType[] = hiddenItems?.map((item) => {
      const hasConfirm = !!item.onConfirm;
      const defaultIcon = item.delete ? <DeleteOutlined /> : <FormOutlined />;
      const menuButtonContent = (
        <Button
          type="text"
          danger={item.delete}
          icon={renderIcon(item.icon, defaultIcon)}
          className={`${styles.menuItem} ${item.className ?? ""}`.trim()}
          onClick={(e) => {
            stopPropagation(e);
            if (!hasConfirm) {
              item.onClick?.();
            }
          }}
          {...(item.hasPermi?.length ? { hasPermi: item.hasPermi } : {})}
          {...Object.fromEntries(
            Object.entries(item).filter(
              ([key]) =>
                ![
                  "title",
                  "icon",
                  "delete",
                  "className",
                  "hasPermi",
                  "menu",
                  "onClick",
                  "onConfirm",
                  "popconfirm",
                  "hidden",
                  "maxVisible",
                  "enableEllipsis",
                  "moreIcon",
                ].includes(key)
            )
          )}
        >
          {item.title}
        </Button>
      );

      return {
        key: String(item.title),
        label: hasConfirm ? (
          <Popconfirm
            placement="left"
            title={item.popconfirm?.title ?? `确认${item.title}?`}
            okText="确认"
            cancelText="取消"
            onConfirm={handleMenuItemConfirm(item)}
            onCancel={stopPropagation}
            {...item.popconfirm}
          >
            {menuButtonContent}
          </Popconfirm>
        ) : (
          menuButtonContent
        ),
      };
    });

    return (
      <div className={styles.container}>
        {visibleItems?.map((item, index) => {
          const hasConfirm = !!item.onConfirm;
          const {
            title: itemTitle,
            icon: itemIcon,
            delete: itemDelete,
            className: itemClassName,
            hasPermi: itemHasPermi,
          } = item;
          // When passing through the remaining Button props, exclude event/config keys to prevent onConfirm etc. from leaking to the DOM (React warning)
          const itemButtonProps = Object.fromEntries(
            Object.entries(item).filter(
              ([key]) =>
                ![
                  "title",
                  "icon",
                  "delete",
                  "className",
                  "hasPermi",
                  "menu",
                  "onClick",
                  "onConfirm",
                  "popconfirm",
                  "hidden",
                  "maxVisible",
                  "enableEllipsis",
                  "moreIcon",
                ].includes(key)
            )
          );
          const defaultIcon = itemDelete ? (
            <DeleteOutlined />
          ) : (
            <FormOutlined />
          );
          const buttonContent = (
            <Button
              key={index}
              icon={renderIcon(itemIcon, defaultIcon)}
              type="link"
              danger={itemDelete}
              className={`${styles.Operate} ${itemClassName ?? ""}`.trim()}
              onClick={(e) => {
                stopPropagation(e);
                if (!hasConfirm) {
                  item.onClick?.();
                }
              }}
              {...(itemHasPermi?.length ? { hasPermi: itemHasPermi } : {})}
              {...itemButtonProps}
            >
              {itemTitle}
            </Button>
          );

          if (hasConfirm) {
            return (
              <Popconfirm
                key={index}
                placement="bottom"
                title={item.popconfirm?.title ?? `确认${item.title}?`}
                okText="确认"
                cancelText="取消"
                onConfirm={handleMenuItemConfirm(item)}
                onCancel={stopPropagation}
                {...item.popconfirm}
              >
                {buttonContent}
              </Popconfirm>
            );
          }

          return buttonContent;
        })}
        {isOverflow && hiddenItems.length > 0 && (
          <Dropdown
            classNames={{ root: styles.menu }}
            placement="bottom"
            menu={{ items: menuItems }}
          >
            <Button
              icon={renderIcon(
                moreIcon,
                <img src={moreImg} alt="more" className={styles.moreImg} />
              )}
              iconPosition="end"
              type="link"
              className={classNames(buttonClassName, styles.moreButton)}
              onClick={stopPropagation}
              {...buttonProps}
            >
              {title}
            </Button>
          </Dropdown>
        )}
      </div>
    );
  }

  // Single operate button
  const hasConfirm = !!onConfirm;
  const defaultIcon = isDelete ? <DeleteOutlined /> : <FormOutlined />;
  const buttonContent = (
    <Button
      icon={renderIcon(icon, defaultIcon)}
      type="link"
      danger={isDelete}
      className={buttonClassName}
      onClick={(e) => {
        stopPropagation(e);
        if (!hasConfirm) {
          onClick?.();
        }
      }}
      {...buttonProps}
    >
      {title}
    </Button>
  );

  if (hasConfirm) {
    return (
      <div className={styles.container}>
        <Popconfirm
          placement="bottom"
          title={popconfirm?.title ?? `确认${title}?`}
          okText="确认"
          cancelText="取消"
          onConfirm={handleConfirm}
          onCancel={stopPropagation}
          {...popconfirm}
        >
          {buttonContent}
        </Popconfirm>
      </div>
    );
  }

  return <div className={styles.container}>{buttonContent}</div>;
};

export default Operate;
