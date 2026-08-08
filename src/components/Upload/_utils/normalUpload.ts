import axios, { AxiosRequestConfig, Canceler } from "axios";
import { RcFile } from "antd/es/upload";
import { deepCopy } from "hsu-utils";
import { validateFile, createFormData, isSuccessResponse } from ".";
import { UploadingList } from "..";
import type { UploadRequestOption } from "../../../types/antd";

interface NormalUploadOptions {
  file: RcFile;
  action: string;
  data?: Partial<Record<string, string>>;
  headers?: AxiosRequestConfig["headers"];
  accept?: string;
  size?: number;
  en?: boolean;
  uploadingList: UploadingList;
  setUploadingList: (list: UploadingList) => void;
  onProgress?: UploadRequestOption["onProgress"];
  onSuccess?: UploadRequestOption["onSuccess"];
  onError?: UploadRequestOption["onError"];
  onUploadSuccess?: () => void;
}

/**
 * Normal file upload
 */
export async function normalUpload({
  file,
  action,
  data,
  headers,
  accept,
  size,
  en,
  uploadingList,
  setUploadingList,
  onProgress,
  onSuccess,
  onError,
  onUploadSuccess,
}: NormalUploadOptions) {
  // Validate the file
  const validation = validateFile({ file, accept, size, en });
  if (!validation.valid) {
    onError?.(validation.error!);
    return;
  }

  const formData = createFormData(data);
  formData.append("file", file);

  const CancelToken = axios.CancelToken;

  const postPromise = axios.post(action, formData, {
    headers,
    onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
      if (progressEvent.loaded === progressEvent.total) {
        onProgress?.({ percent: 50 });
      }
    },
    cancelToken: new CancelToken(function executor(c: Canceler) {
      uploadingList[file.uid]
        ? uploadingList[file.uid].push(c)
        : (uploadingList[file.uid] = [c]);
      setUploadingList(deepCopy(uploadingList));
    }),
  });

  postPromise
    .then((res: { data: any }) => {
      if (isSuccessResponse(res.data)) {
        onProgress?.({ percent: 100 });
        onSuccess?.(res.data);
        onUploadSuccess?.();
      } else {
        onError?.(
          new Error(res.data.msg || (en ? "Upload failed" : "上传失败"))
        );
      }

      delete uploadingList[file.uid];
      setUploadingList(deepCopy(uploadingList));
    })
    .catch((e: unknown) => {
      if ((e as { code: string }).code === "ERR_CANCELED") {
        onSuccess?.({ code: "ERR_CANCELED" });
      } else {
        onError?.(new Error(en ? "Upload failed" : "上传失败"));
      }

      delete uploadingList[file.uid];
      setUploadingList(deepCopy(uploadingList));
    });
}
