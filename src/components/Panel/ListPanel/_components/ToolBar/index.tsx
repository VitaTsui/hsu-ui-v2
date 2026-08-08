import Button from "../../../../Button";
import { Equal } from "hsu-utils";
import Icon from "../../../../Icon";
import React, { ReactNode } from "react";
import TabBar from "../../../../TabBar";
import classNames from "classnames";
import styles from "./index.module.scss";
import { ListPanelTabelProps } from "../..";
import { isLegacyHasSelectorBrowser } from "../../../../../utils/cssSupports";

interface ToolBarProps {
  columns?: ListPanelTabelProps["columns"];
  title?: ListPanelTabelProps["title"];
  tabBarProps?: ListPanelTabelProps["tabBarProps"];
  buttonGroup?: ListPanelTabelProps["buttonGroup"];
  tableTools?: ListPanelTabelProps["tableTools"];
  setShowColumnMgt?: (value: React.SetStateAction<boolean>) => void;
  tips?: ReactNode;
  otherTool?: ReactNode;
}

const ToolBar: React.FC<ToolBarProps> = (props) => {
  const {
    columns,
    title,
    tabBarProps,
    buttonGroup,
    tableTools = {},
    setShowColumnMgt,
    tips,
    otherTool,
  } = props;
  const { columnMgt } = tableTools;
  const hasTitleTabBar =
    !!title || !!tips || !Equal.ValEqual(tabBarProps ?? {}, {});
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  return (
    <>
      {(!!title ||
        !Equal.ValEqual(tabBarProps ?? {}, {}) ||
        !!buttonGroup?.length ||
        !Equal.ValEqual(tableTools ?? {}, {})) && (
        <div
          className={classNames(styles.ToolBar, {
            [styles.legacyNoTitleTabBar]:
              legacyHasSelector && !hasTitleTabBar,
          })}
        >
          {hasTitleTabBar && (
            <div className={styles.title_tabBar}>
              {(!!title || !!tips) && (
                <div className={styles.title}>
                  {title && <span>{title}</span>}
                  {tips && <div className={styles.tips}>{tips}</div>}
                </div>
              )}
              {!Equal.ValEqual(tabBarProps ?? {}, {}) && (
                <TabBar
                  {...tabBarProps}
                  className={classNames(styles.tabBar, tabBarProps?.className)}
                />
              )}
            </div>
          )}
          {(!!buttonGroup?.length || !Equal.ValEqual(tableTools ?? {}, {})) && (
            <div className={styles.btns_tools}>
              {otherTool}
              {!!buttonGroup?.length && (
                <div className={styles.buttonGroup}>
                  {buttonGroup?.map((button, idx) => {
                    const { title, children, ...buttonProps } = button;
                    return (
                      <Button.Basic key={idx} {...buttonProps}>
                        {title || children}
                      </Button.Basic>
                    );
                  })}
                </div>
              )}
              {!Equal.ValEqual(tableTools ?? {}, {}) && (
                <div className={styles.tableTools}>
                  {columnMgt && (
                    <Icon
                      icon="lets-icons:setting-line"
                      className={classNames(styles.toolItem, {
                        [styles.disabled]: !columns?.filter((i) => i.dataIndex)
                          ?.length,
                      })}
                      onClick={() => {
                        if (columns?.filter((i) => i.dataIndex)?.length) {
                          setShowColumnMgt?.(true);
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ToolBar;
