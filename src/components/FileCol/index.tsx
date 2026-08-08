import FilePreview, {
  FilePreviewType,
  FilePreviewTypeArr,
} from "../FilePreview";
import { Tooltip, UploadFile } from "antd";
import React, { useState } from "react";
import styles from "./index.module.scss";

interface UrlItemProps {
  item?: UploadFile[];
  hideNm?: boolean;
}

const FileCol: React.FC<UrlItemProps> = (props) => {
  const { item = [], hideNm } = props;
  const [file, setFile] = useState<{
    fileUrl?: string;
    fileType?: FilePreviewType;
    fileName?: string;
  }>({});

  return (
    <>
      <div className={styles.FileCol}>
        {item?.filter(Boolean)?.map((file) => {
          const fileType = file.name?.split(".").pop()?.toLowerCase();

          return (
            <div key={file.uid} className={styles.fileItem}>
              {!hideNm && (
                <Tooltip
                  title={file.name}
                  color="var(--vita-muted)"
                  styles={{
                    container: { color: "var(--vita-foreground)", padding: "6px 16px" },
                  }}
                >
                  <span className={styles.fileName}>{file.name}</span>
                </Tooltip>
              )}
              {fileType && FilePreviewTypeArr.includes(fileType) && (
                <a
                  onClick={() => {
                    setFile({ fileUrl: file.url, fileType: fileType });
                  }}
                >
                  查看
                </a>
              )}
            </div>
          );
        })}
      </div>
      <FilePreview
        {...file}
        open={!!file.fileUrl}
        onClose={() => setFile({})}
      />
    </>
  );
};

export default FileCol;
