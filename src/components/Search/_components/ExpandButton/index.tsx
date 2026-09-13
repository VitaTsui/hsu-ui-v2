import React from "react";
import Button from "../../../Button";
import classNames from "classnames";
import Icon from "../../../Icon";
import styles from "../../index.module.scss";

interface ExpandButtonProps {
  expand: boolean;
  toggleExpand: () => void;
  advancedFilters?: boolean;
  showExpandButton: boolean;
  showAllSearchItems?: boolean;
}

export const ExpandButton: React.FC<ExpandButtonProps> = ({
  expand,
  toggleExpand,
  advancedFilters = false,
  showExpandButton,
  showAllSearchItems = false,
}) => {
  if (!showExpandButton) {
    return null;
  }

  return (
    <Button
      type="link"
      onClick={toggleExpand}
      className={classNames(styles.show, {
        [styles.advancedFilters]: advancedFilters,
      })}
      icon={
        advancedFilters ? (
          <Icon icon="ant-design:filter-filled" className={styles.icon} />
        ) : (
          <Icon icon="ant-design:down-outlined" className={styles.icon} />
        )
      }
      iconPosition="end"
    >
      {advancedFilters
        ? "高级筛选"
        : expand
        ? "收起"
        : showAllSearchItems
        ? "更多"
        : "展开"}
    </Button>
  );
};
