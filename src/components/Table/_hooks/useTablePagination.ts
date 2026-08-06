import { useCallback, useEffect, useMemo, useState } from "react";
import { Equal } from "hsu-utils";
import { PaginationProps } from "../../Pagination";
import { TableProps } from "..";
import { AnyObject } from "antd/es/_util/type";
import usePaginationSync from "../../Pagination/_hooks/usePaginationSync";

interface UseTablePaginationParams<T extends AnyObject> {
  dataSource?: TableProps<T>["dataSource"];
  pagination?: false | PaginationProps;
  staticDataSource?: boolean;
  current?: number;
  pageSize?: number;
  onChangePage?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (page: number, pageSize: number) => void;
  onStaticPaginationChange?: (page: number, pageSize: number) => void;
}

const useTablePagination = <T extends AnyObject>(
  params: UseTablePaginationParams<T>
) => {
  const {
    dataSource,
    pagination,
    staticDataSource = false,
    onChangePage,
    onShowSizeChange,
    onStaticPaginationChange,
  } = params;

  // Pass the raw values directly without defaults; let usePaginationSync handle them itself
  const { _pageNum, _pageSize, setPageNum, setPageSize } = usePaginationSync({
    current: params.current,
    pageSize: params.pageSize,
  });
  const [_dataSource, setDataSource] = useState<typeof dataSource>([]);

  useEffect(() => {
    if (!Equal.ObjEqual(dataSource, _dataSource)) {
      setDataSource(dataSource);

      if (staticDataSource) {
        setPageNum(1);
      }
    }
  }, [_dataSource, dataSource, staticDataSource, setPageNum]);

  // Compute the paginated data source
  const paginatedDataSource = useMemo(() => {
    if (!pagination) return dataSource;
    if (staticDataSource) {
      const start = _pageSize * (_pageNum - 1);
      return _dataSource?.slice(start, start + _pageSize);
    }
    return dataSource;
  }, [
    pagination,
    staticDataSource,
    _dataSource,
    _pageSize,
    _pageNum,
    dataSource,
  ]);

  // Compute the data source used for merged rows
  const mergeRowDataSource = useMemo(() => {
    if (!pagination) return dataSource;
    const start = _pageSize * (_pageNum - 1);
    return _dataSource?.slice(start, start + _pageSize);
  }, [pagination, _dataSource, _pageSize, _pageNum, dataSource]);

  // Handle pagination changes
  const handlePageChange = useCallback(
    (num: number, size: number) => {
      setPageNum(num);
      setPageSize(size);
      onChangePage?.(num, size);
      // When staticDataSource is used, propagate the change via onStaticPaginationChange
      if (staticDataSource) {
        onStaticPaginationChange?.(num, size);
      }
    },
    [
      onChangePage,
      onStaticPaginationChange,
      staticDataSource,
      setPageNum,
      setPageSize,
    ]
  );

  // Handle page size changes
  const handlePageSizeChange = useCallback(
    (page: number, size: number) => {
      setPageNum(page);
      setPageSize(size);
      onShowSizeChange?.(page, size);
      // When staticDataSource is used, propagate the change via onStaticPaginationChange
      if (staticDataSource) {
        onStaticPaginationChange?.(page, size);
      }
    },
    [
      onShowSizeChange,
      onStaticPaginationChange,
      staticDataSource,
      setPageNum,
      setPageSize,
    ]
  );

  return {
    _pageNum,
    _pageSize,
    _dataSource,
    setPageNum,
    setPageSize,
    paginatedDataSource,
    mergeRowDataSource,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default useTablePagination;
