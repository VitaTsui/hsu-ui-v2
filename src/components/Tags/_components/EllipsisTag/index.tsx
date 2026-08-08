import { Tag, Tooltip } from "antd";
import React from "react";
import { getTagColor } from "../../_utils";
import styles from "./index.module.scss";

export interface EllipsisTagProps {
  ellipsisTags: string[];
  startIndex: number;
  colors?: string[];
}

/**
 * Ellipsis tag component: shows the number of omitted tags, and displays all omitted tags in a Tooltip on hover
 */
const EllipsisTag: React.FC<EllipsisTagProps> = (props) => {
  const { ellipsisTags, startIndex, colors } = props;

  if (ellipsisTags.length === 0) {
    return null;
  }

  return (
    <Tooltip
      title={
        <div className={styles.tooltipContent}>
          {ellipsisTags?.map((tag, index) => (
            <Tag
              key={`ellipsis-${tag}-${index}`}
              color={getTagColor(startIndex + index, colors)}
              className={styles.tooltipTag}
            >
              {tag}
            </Tag>
          ))}
        </div>
      }
      classNames={{
        root: styles.tooltip,
      }}
      color="#fff"
      styles={{
        container: {
          padding: "6px",
          maxHeight: "300px",
          overflow: "auto",
        },
      }}
    >
      <Tag className={styles.ellipsisTag}>+{ellipsisTags.length}</Tag>
    </Tooltip>
  );
};

export default EllipsisTag;
