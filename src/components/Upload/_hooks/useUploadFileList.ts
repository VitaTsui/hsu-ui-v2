import { useEffect, useState } from "react";
import { UploadFile } from "antd";
import { deepCopy, Equal } from "hsu-utils";
import { extractFileUrl } from "../_utils";
import { useLatestRef } from "../../../hooks/useLatestRef";

interface UseUploadFileListProps {
  fileList?: UploadFile[];
  onChange?: (params: { file: UploadFile; fileList: UploadFile[] }) => void;
  rmFile?: string;
}

/**
 * Manage the upload file list state
 */
export function useUploadFileList({
  fileList,
  onChange,
  rmFile,
}: UseUploadFileListProps) {
  const [_fileList, setFilelist] = useState<UploadFile[]>([]);
  const [lastFileList, setLastFileList] = useState<UploadFile[]>([]);
  const onChangeRef = useLatestRef(onChange);

  // 回调 prop 不进依赖数组：消费方传内联箭头时每次渲染都是新引用，effect 会跟着
  // 重跑并再调一次回调 —— 回调里 setState 就是死循环（详见 Input/TextArea 的说明）
  useEffect(() => {
    if (rmFile) {
      const file = _fileList.find((item) => item.uid === rmFile);
      const filteredList = _fileList.filter((item) => item.uid !== rmFile);
      if (file) {
        setFilelist(filteredList);
        setTimeout(() => {
          onChangeRef.current?.({
            file,
            fileList: filteredList,
          });
        }, 100);
      }
    }
  }, [_fileList, onChangeRef, rmFile]);

  useEffect(() => {
    if (!Equal.ObjEqual(fileList ?? [], lastFileList)) {
      if (fileList?.length) {
        setFilelist(deepCopy(fileList));
        setLastFileList(deepCopy(fileList));
      } else {
        setFilelist([]);
        setLastFileList([]);
      }
    }
  }, [fileList, lastFileList]);

  const handleChange = ({
    file,
    fileList: newFileList,
  }: {
    file: UploadFile;
    fileList: UploadFile[];
  }) => {
    setFilelist(newFileList);

    const uploaded = newFileList.filter((item) => item.status !== "uploading");
    if (uploaded.length) {
      const processedList = uploaded
        .filter((item) => item?.response?.code !== "ERR_CANCELED")
        ?.map((item) => extractFileUrl(item));

      onChange?.({
        file,
        fileList: processedList,
      });
      setLastFileList(processedList);
    }
  };

  return {
    fileList: _fileList,
    setFileList: setFilelist,
    onChange: handleChange,
  };
}
