import { useEffect, useRef, useState } from "react";
import { deepCopy, Equal } from "hsu-utils";
import { UploadingList } from "..";
import { useLatestRef } from "../../../hooks/useLatestRef";

interface UseUploadOperationsProps {
  onUploadingList?: (list: UploadingList) => void;
}

/**
 * Manage upload and download operations
 */
export function useUploadOperations({
  onUploadingList,
}: UseUploadOperationsProps) {
  const [uploadingList, setUploadingList] = useState<UploadingList>({});
  const [lastUploadList, setLastUploadList] = useState<UploadingList>({});
  const [downloading, setDownloading] = useState<
    Record<string, AbortController>
  >({});
  const operationsRef = useRef<{
    downloading: Record<string, AbortController>;
    uploadingList: UploadingList;
  }>({
    downloading: {},
    uploadingList: {},
  });

  const onUploadingListRef = useLatestRef(onUploadingList);

  // Sync to the ref on update
  useEffect(() => {
    operationsRef.current.downloading = downloading;
  }, [downloading]);

  useEffect(() => {
    operationsRef.current.uploadingList = uploadingList;
  }, [uploadingList]);

  // 回调 prop 不进依赖数组：消费方传内联箭头时每次渲染都是新引用，effect 会跟着
  // 重跑并再调一次回调 —— 回调里 setState 就是死循环（详见 Input/TextArea 的说明）
  useEffect(() => {
    if (!Equal.ObjEqual(uploadingList, lastUploadList)) {
      onUploadingListRef.current?.(deepCopy(uploadingList));
      setLastUploadList(deepCopy(uploadingList));
    }
  }, [uploadingList, lastUploadList, onUploadingListRef]);

  // Cleanup function
  useEffect(() => {
    return () => {
      const {
        downloading: currentDownloading,
        uploadingList: currentUploadingList,
      } = operationsRef.current;

      Object.values(currentDownloading)?.forEach((controller) => {
        controller?.abort();
      });

      Object.values(currentUploadingList)?.forEach((controllers) => {
        controllers?.forEach((c) => c?.());
      });

      operationsRef.current = {
        downloading: {},
        uploadingList: {},
      };
      setDownloading({});
      setUploadingList({});
      setLastUploadList({});
    };
  }, []);

  return {
    uploadingList,
    setUploadingList,
    downloading,
    setDownloading,
    operationsRef,
  };
}
