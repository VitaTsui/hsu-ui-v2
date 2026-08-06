import { useEffect, useState } from "react";

interface UsePaginationSyncParams {
  current?: number;
  pageSize?: number;
}

/**
 * Pagination state sync hook
 * Syncs externally provided current and pageSize into internal state
 * Note: sync only happens when current/pageSize is explicitly provided; undefined is not affected by defaults
 */
const usePaginationSync = (params: UsePaginationSyncParams) => {
  const { current, pageSize } = params;

  const [_pageNum, setPageNum] = useState<number>(current ?? 1);
  const [_pageSize, setPageSize] = useState<number>(pageSize ?? 10);

  useEffect(() => {
    // Sync only when current is explicitly provided
    if (current !== undefined && current !== _pageNum) {
      setPageNum(current);
    }
  }, [_pageNum, current]);

  useEffect(() => {
    // Sync only when pageSize is explicitly provided
    if (pageSize !== undefined && pageSize !== _pageSize) {
      setPageSize(pageSize);
    }
  }, [_pageSize, pageSize]);

  return {
    _pageNum,
    _pageSize,
    setPageNum,
    setPageSize,
  };
};

export default usePaginationSync;
