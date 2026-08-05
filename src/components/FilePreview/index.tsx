import React, { Suspense, lazy } from "react";
import VideoPreview from "./_components/VideoPreview";
import TextPreview from "./_components/TextPreview";
import ImagePreview from "./_components/ImagePreview";
import { FilePreviewType, FilePreviewTypeArr } from "./_utils";

export type { FilePreviewType };
export { FilePreviewTypeArr };

/**
 * 重型格式按需加载。
 *
 * FilePreview 是个按 fileType 分发的 dispatcher，而它处在 Upload / FormItem 的静态
 * 依赖图上（FormItem → FormUpload → Upload → FilePreview），业务侧只要用到任何一种
 * 表单项，下面这些只服务于特定格式的库就会被打进首屏：
 *
 *   pdf   → PdfPreview       → hsu-utils 的 RenderPDF → pdfjs-dist   约 374 KB
 *   xlsx  → XlsxPreviewPane  → xlsx ＋ x-data-spreadsheet
 *   md    → MarkdownPreview  → Markdown → katex 等
 *
 * 修 dispatcher 而不是逐个改它的引用方：这里改一次，所有静态 import FilePreview 的
 * 地方（Upload、UploadedItem、FormImage…）都受益，也不会因为将来多一个引用方而回归。
 *
 * 图片/文本/视频三种是轻量实现，保持静态——它们也是最常命中的格式，不值得为其
 * 付一次异步往返。
 */
const PdfPreview = lazy(() => import("./_components/PdfPreview"));
const MarkdownPreview = lazy(() => import("./_components/MarkdownPreview"));
const XlsxPreviewPane = lazy(() => import("./_components/XlsxPreviewPane"));

interface FilePreviewProps {
  fileUrl?: string;
  fileType?: FilePreviewType;
  fileName?: string;
  open?: boolean;
  onClose?: () => void;
  text?: string;
  className?: string;
  pagination?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = (props) => {
  const { fileUrl, fileType, open, onClose, text, className, pagination } =
    props;

  if (!open) {
    return null;
  }

  switch (fileType) {
    case "mp4": {
      return (
        <VideoPreview
          fileUrl={fileUrl}
          onClose={onClose}
          className={className}
        />
      );
    }
    case "pdf": {
      return (
        <Suspense fallback={null}>
          <PdfPreview
            fileUrl={fileUrl}
            open={open}
            onClose={onClose}
            className={className}
            pagination={pagination}
          />
        </Suspense>
      );
    }
    case "jpg":
    case "jpeg":
    case "png":
    case "gif": {
      return (
        <ImagePreview
          fileUrl={fileUrl}
          onClose={onClose}
          className={className}
        />
      );
    }
    case "txt": {
      return (
        <TextPreview text={text} onClose={onClose} className={className} />
      );
    }
    case "md": {
      return (
        <Suspense fallback={null}>
          <MarkdownPreview
            text={text}
            onClose={onClose}
            className={className}
          />
        </Suspense>
      );
    }
    case "xlsx": {
      return (
        <Suspense fallback={null}>
          <XlsxPreviewPane
            fileUrl={fileUrl}
            fileType={fileType}
            onClose={onClose}
            className={className}
          />
        </Suspense>
      );
    }
    default: {
      return null;
    }
  }
};

export default FilePreview;
