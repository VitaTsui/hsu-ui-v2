import React from "react";

import XlsxPreview from "../XlsxPreview";
import { useXlsxData } from "../../_hooks";

export interface XlsxPreviewPaneProps {
  fileUrl?: string;
  fileType?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * xlsx 预览的完整单元：取数（useXlsxData → xlsx）＋ 渲染（XlsxPreview → x-data-spreadsheet）。
 *
 * 单独成文件是为了让 FilePreview 能整体 lazy 掉它。useXlsxData 是 hook，不能写在
 * switch 的某个分支里，若留在 FilePreview 顶层就会把 xlsx 静态拖进依赖图——那正是
 * 要避免的。把「取数 + 渲染」收进同一个组件，整块按需加载。
 */
const XlsxPreviewPane: React.FC<XlsxPreviewPaneProps> = ({
  fileUrl,
  fileType,
  onClose,
  className,
}) => {
  const xlsxData = useXlsxData({ fileType, fileUrl });

  return (
    <XlsxPreview xlsxData={xlsxData} onClose={onClose} className={className} />
  );
};

export default XlsxPreviewPane;
