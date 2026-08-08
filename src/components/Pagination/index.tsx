import {
  Pagination as AntdPagination,
  PaginationProps as AntdPaginationProps,
  Select,
} from "antd";
import React, { ReactNode, useMemo, useRef } from "react";

import type { SelectRef } from "../../types/antd";
import Icon from "../Icon";
import classNames from "classnames";
import styles from "./index.module.scss";
import usePaginationSync from "./_hooks/usePaginationSync";

export interface PaginationProps
  extends Omit<AntdPaginationProps, "pageSizeOptions" | "showTotal"> {
  pageSizeOptions?: number[];
  bordered?: boolean;
  listLength?: number;
  showTotal?: false | ((total: number, range: [number, number]) => ReactNode);
  onStaticPaginationChange?: (page: number, pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = (props) => {
  const {
    simple,
    pageSizeOptions = [],
    showSizeChanger,
    onShowSizeChange,
    onChange,
    pageSize = 10,
    total,
    className,
    bordered,
    listLength,
    showTotal,
    align,
  } = props;
  const selectRef = useRef<SelectRef>(null);
  // Pass the raw values directly without defaults; let usePaginationSync handle them itself
  const { _pageNum, _pageSize, setPageNum, setPageSize } = usePaginationSync({
    current: props.current,
    pageSize: props.pageSize,
  });

  const _pageSizeOptions = useMemo(() => {
    if (pageSize && (pageSizeOptions as number[]).includes(pageSize)) {
      return pageSizeOptions;
    }

    return [...pageSizeOptions, pageSize].sort();
  }, [pageSize, pageSizeOptions]);

  if (simple) {
    return (
      <ul
        className={classNames(styles.PaginationSimple, className, {
          [styles.start]: align === "start",
          [styles.center]: align === "center",
        })}
      >
        {showTotal && (
          <li className={styles.total}>{showTotal(total || 0, [0, 0])}</li>
        )}
        <li
          className={classNames(styles.prev, {
            [styles.disabled]: _pageNum <= 1,
          })}
          onClick={() => {
            if (_pageNum > 1) {
              setPageNum(_pageNum - 1);
              onChange?.(_pageNum - 1, _pageSize);
            }
          }}
        >
          <Icon icon="icon-park:left" className={styles.icon} />
          上一页
        </li>
        <li
          className={classNames(styles.next, {
            [styles.disabled]: !listLength || listLength < _pageSize,
          })}
          onClick={() => {
            if (listLength && listLength >= _pageSize) {
              setPageNum(_pageNum + 1);
              onChange?.(_pageNum + 1, _pageSize);
            }
          }}
        >
          下一页
          <Icon icon="icon-park:right" className={styles.icon} />
        </li>
        {showSizeChanger && (
          <li>
            <Select
              size="small"
              options={_pageSizeOptions?.map((item) => ({
                label: `${item}条/页`,
                value: item,
              }))}
              value={_pageSize}
              showSearch
              className={styles.select}
              getPopupContainer={() =>
                selectRef.current?.nativeElement ?? document.body
              }
              popupMatchSelectWidth={false}
              ref={selectRef}
              onChange={(value) => {
                onShowSizeChange?.(1, value);
                onChange?.(1, value);

                setPageNum(1);
                setPageSize(value);
              }}
            />
          </li>
        )}
      </ul>
    );
  }

  return (
    <AntdPagination
      {...props}
      // Use internal state when no external value is provided
      current={props.current ?? _pageNum}
      pageSize={props.pageSize ?? _pageSize}
      total={total}
      showTotal={showTotal === false ? undefined : showTotal}
      align={align}
      className={classNames(styles.Pagination, className, {
        [styles.bordered]: bordered,
      })}
      onChange={(page, size) => {
        // Update internal state when no external value is provided
        if (props.current === undefined) setPageNum(page);
        if (props.pageSize === undefined) setPageSize(size);
        onChange?.(page, size);
      }}
      onShowSizeChange={(page, size) => {
        if (props.current === undefined) setPageNum(page);
        if (props.pageSize === undefined) setPageSize(size);
        onShowSizeChange?.(page, size);
      }}
    />
  );
};

export default Pagination;
