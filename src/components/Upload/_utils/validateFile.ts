import { RcFile } from "antd/es/upload";
import { toMB } from "./toMB";

interface ValidateFileOptions {
  file: RcFile;
  accept?: string;
  size?: number;
  en?: boolean;
}

/**
 * 文件是否命中 accept —— 与 antd 保持一致的语义。
 *
 * 此前是把 accept 拼进正则：`new RegExp(`(${accept.replace(/,/g, "|")})$`)`，有两个问题：
 * 字符没转义（`.png` 里的 `.` 是「任意字符」，实测放行了 `axpng`），且 HTML 允许的 MIME
 * 形式里 `image/*` 的 `*` 会被当成量词（实测把 photo.png 判成了格式错误）。把外部字符串
 * 拼进正则本身也是 ReDoS 入口。
 *
 * 这里照抄 @rc-component/upload 的 attr-accept 语义，而不是另写一套：这个函数是上传前的
 * 预校验，antd 自己的 accept 过滤也在跑，两边规则一旦不一致，就会出现「antd 放行、我们拦下」
 * 或反过来的割裂。逐条 some()，任一命中即通过，全不命中即拒绝 —— 不做额外兜底。
 */
const matchesAccept = (
  file: { name: string; type?: string },
  accept: string
): boolean => {
  const items = accept.split(",");
  const fileName = file.name || "";
  const mimeType = file.type || "";
  const baseMimeType = mimeType.replace(/\/.*$/, "");

  return items.some((item) => {
    const validType = item.trim();
    if (!validType) return false;

    // `*` / `*​/*`：全部放行
    if (/^\*(\/\*)?$/.test(validType)) return true;

    // 扩展名。jpg 与 jpeg 互认，与 attr-accept 一致
    if (validType.charAt(0) === ".") {
      const lowerName = fileName.toLowerCase();
      const lowerType = validType.toLowerCase();
      const affixes =
        lowerType === ".jpg" || lowerType === ".jpeg"
          ? [".jpg", ".jpeg"]
          : [lowerType];
      return affixes.some((affix) => lowerName.endsWith(affix));
    }

    // `image/*` 这类通配
    if (/\/\*$/.test(validType)) {
      return baseMimeType === validType.replace(/\/.*$/, "");
    }

    // MIME 全等
    if (mimeType === validType) return true;

    // `png` 这种没有点也没有斜杠的写法是无效 accept，attr-accept 选择跳过而不是拦下
    if (/^\w+$/.test(validType)) return true;

    return false;
  });
};

/**
 * Validate file format and size
 */
export function validateFile({
  file,
  accept,
  size,
  en,
}: ValidateFileOptions): { valid: boolean; error?: Error } {
  if (accept) {
    if (!matchesAccept(file, accept)) {
      return {
        valid: false,
        error: new Error(
          en
            ? `File format error, please upload ${accept} file`
            : `文件格式错误，请上传 ${accept} 文件`
        ),
      };
    }
  }

  if (size && file.size > toMB(size)) {
    return {
      valid: false,
      error: new Error(
        en ? `File size cannot exceed ${size}MB` : `文件大小不能超过${size}MB`
      ),
    };
  }

  return { valid: true };
}

