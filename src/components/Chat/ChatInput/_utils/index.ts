import { UploadFile } from "antd";
import { notification } from "../../../../feedback";

/**
 * Handle the file upload response
 */
export const handleUploadResponse = (
  fileList: UploadFile[],
  file: UploadFile,
  index: number
): boolean => {
  if (file.status === "error") {
    notification.error({
      message: file.error?.message || "上传失败",
    });
    fileList.splice(index, 1);
    return false;
  }

  if (file.response) {
    if (
      file.response?.code !== 0 &&
      file.response?.code !== 200 &&
      file.response?.code !== undefined
    ) {
      notification.error({
        message: file.response.msg,
      });
      fileList.splice(index, 1);
      return false;
    } else {
      if (file.response?.data?.url) {
        file.url = file.response.data.url;
      }
      if (file.response?.url) {
        file.url = file.response.url;
      }
    }
  } else {
    fileList.splice(index, 1);
    return false;
  }

  return true;
};

/**
 * Validate the file size
 */
export const validateFileSize = (file: File, maxSize: number): boolean => {
  if (file.size > maxSize * 1024 * 1024) {
    notification.error({
      message: `文件大小不能超过${maxSize}MB`,
    });
    return false;
  }
  return true;
};

/**
 * Handle file list changes
 */
export const processFileList = (fileList: UploadFile[]): UploadFile[] => {
  const processedList: UploadFile[] = [];

  fileList?.forEach((file: UploadFile) => {
    if (file.status === "error") {
      notification.error({
        message: file.error?.message || "上传失败",
      });
      return;
    }

    if (file.response) {
      if (
        file.response?.code !== 0 &&
        file.response?.code !== 200 &&
        file.response?.code !== undefined
      ) {
        notification.error({
          message: file.response.msg,
        });
        return;
      } else {
        if (file.response?.data?.url) {
          file.url = file.response.data.url;
        }
        if (file.response?.url) {
          file.url = file.response.url;
        }
      }
    }

    processedList.push(file);
  });

  return processedList;
};
