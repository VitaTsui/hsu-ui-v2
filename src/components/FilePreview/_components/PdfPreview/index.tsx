import React, { useEffect, useRef, useState } from "react";
import { Spin, notification } from "antd";
// 这里用的是 notification 的 hook 版本（useNotification + contextHolder），本来就在 React
// 树里、能读到主题，不需要换成 ../../../../feedback 那层代理 —— 那层解决的是**静态方法**
// 读不到 context 的问题。

import Icon from "../../../Icon";
import { RenderPDF } from "hsu-utils";
import classNames from "classnames";
import styles from "./index.module.scss";

const workerUrl = "/pdf.worker.min.js";

interface PdfPreviewProps {
  fileUrl?: string;
  open?: boolean;
  onClose?: () => void;
  className?: string;
  pagination?: boolean;
}

const PdfPreview: React.FC<PdfPreviewProps> = (props) => {
  const { fileUrl, open, onClose, className, pagination = true } = props;
  const PDFRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [full, setFull] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    setPage(0);
    setNumPages(0);
    if (fileUrl) {
      setLoading(true);
      RenderPDF.getNumPages(fileUrl, workerUrl).then((num) => {
        setNumPages(!pagination ? 1 : num);
        setPage(1);
        setLoading(false);
      });
    }
  }, [fileUrl, pagination]);

  useEffect(() => {
    if (PDFRef.current && fileUrl && page && pagination) {
      RenderPDF.render({
        pdfUrl: fileUrl,
        containerId: "pdf-preview",
        pixelRatio: 4,
        startPageNum: page,
        endPageNum: page,
        scale: full ? 1 : scale,
        workerSrc: workerUrl,
      });
    }
  }, [fileUrl, page, scale, full, pagination]);

  useEffect(() => {
    if (PDFRef.current && fileUrl && !pagination) {
      RenderPDF.render({
        pdfUrl: fileUrl,
        containerId: "pdf-preview",
        pixelRatio: 4,
        scale: full ? 1 : scale,
        workerSrc: workerUrl,
      });
    }
  }, [fileUrl, full, pagination, scale]);

  useEffect(() => {
    window.onresize = () => {
      if (!document.fullscreenElement && full) {
        setFull(false);
        document.exitFullscreen?.();
      }
    };
  }, [full]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (page > 1 && e.key === "ArrowLeft") {
        setPage(page - 1);
      }

      if (page < numPages && e.key === "ArrowRight") {
        setPage(page + 1);
      }
    };

    if (PDFRef.current) {
      document.addEventListener("keydown", keydown);
    }

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  }, [full, numPages, page]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={classNames(
        styles.PdfPreview,
        { [styles.full]: full },
        className
      )}
      ref={previewRef}
    >
      {!full && (
        <div className={styles.close} onClick={() => onClose?.()}>
          <Icon icon="ant-design:close-outlined" />
        </div>
      )}
      <div
        className={styles.pdf}
        id="pdf-preview"
        ref={PDFRef}
        onMouseDown={(e) => {
          const w = PDFRef.current?.clientWidth;
          const x = e.clientX;

          if (full && w) {
            if (page > 1 && x < w / 2) {
              setPage(page - 1);
            }

            if (page < numPages && x > w / 2) {
              setPage(page + 1);
            }
          }
        }}
      >
        {contextHolder}
        {loading && <Spin size="large" className={styles.loading} />}
      </div>
      <div className={styles.toolContainer}>
        <div className={styles.pdfTool}>
          <ul className={styles.toolItem}>
            <li
              className={classNames(styles.toolItemItem, {
                [styles.disabled]: numPages <= 1 || page <= 1,
              })}
              onClick={() => {
                if (page > 1) {
                  setPage(page - 1);
                }
              }}
            >
              <Icon icon="mingcute:left-line" />
            </li>
            <li className={styles.page}>
              <span>{page}</span>/<span>{numPages}</span>
            </li>
            <li
              className={classNames(styles.toolItemItem, {
                [styles.disabled]: numPages <= 1 || page >= numPages,
              })}
              onClick={() => {
                if (page < numPages) {
                  setPage(page + 1);
                }
              }}
            >
              <Icon icon="mingcute:right-line" />
            </li>
          </ul>
          <ul className={styles.toolItem}>
            <li
              className={classNames(styles.toolItemItem, {
                [styles.disabled]: scale <= 1 || loading || full,
              })}
              onClick={() => {
                if (scale > 1 && !full) {
                  setScale(scale - 0.1);
                }
              }}
            >
              <Icon icon="mingcute:zoom-out-line" />
            </li>
            <li
              className={classNames(styles.toolItemItem, {
                [styles.disabled]: scale >= 2 || loading || full,
              })}
              onClick={() => {
                if (scale < 2 && !full) {
                  setScale(scale + 0.1);
                }
              }}
            >
              <Icon icon="mingcute:zoom-in-line" />
            </li>
          </ul>
          <ul className={styles.toolItem}>
            <li
              className={classNames(styles.toolItemItem, {
                [styles.disabled]: loading || !fileUrl || full,
              })}
              onClick={() => {
                // 只放行可导航的协议。fileUrl 通常来自后端，但 FilePreview 展示的本就是
                // 用户上传的文件，若这个值一路从用户数据流下来，javascript: 会在
                // 本站源里执行。noopener 同时切断被打开页对 window.opener 的访问。
                if (fileUrl && !full && /^(https?:|blob:|\/)/i.test(fileUrl)) {
                  window.open(fileUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <Icon icon="material-symbols:download" />
            </li>
          </ul>
          <ul className={styles.toolItem}>
            <li
              className={classNames(styles.toolItemItem, {
                [styles.disabled]: loading || !fileUrl,
              })}
              onClick={() => {
                setFull(!full);

                if (previewRef.current) {
                  const div = previewRef.current;
                  if (!full) {
                    div.requestFullscreen?.();
                    api.info({
                      message: (
                        <div>
                          <p>可以使用左右方向键进行翻页</p>
                          <p>也可以使用鼠标点击左右两侧进行翻页</p>
                          <p>鼠标移至底部以显示控制栏</p>
                        </div>
                      ),
                      onClose: () => {
                        document.body.appendChild(
                          document.querySelector(".ant-notification") as Node
                        );
                      },
                    });
                    setTimeout(() => {
                      previewRef.current?.appendChild(
                        document.querySelector(".ant-notification") as Node
                      );
                    }, 1);
                  } else {
                    document.exitFullscreen?.();
                  }
                }
              }}
            >
              <Icon
                icon={
                  full ? "gridicons:fullscreen-exit" : "lets-icons:full-alt"
                }
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;

