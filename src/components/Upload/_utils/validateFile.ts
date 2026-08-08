import { RcFile } from "antd/es/upload";
import { toMB } from "./toMB";

interface ValidateFileOptions {
  file: RcFile;
  accept?: string;
  size?: number;
  en?: boolean;
}

/**
 * 文件名是否命中 accept。
 *
 * 此前是把 accept 直接拼进正则：`new RegExp(`(${accept.replace(/,/g, "|")})$`)`。有两个问题：
 *
 * 1. accept 里的字符没转义。扩展名里的 `.` 在正则里是「任意字符」，更要紧的是 HTML 标准
 *    允许 accept 写成 MIME 形式（`image/*`、`application/pdf`）—— 那个 `*` 会被当成量词，
 *    整条规则的含义就变了，合法文件反而被判为格式错误。
 * 2. 把外部字符串拼进正则本身就是可回溯爆炸（ReDoS）的入口。
 *
 * 改成按后缀逐项比对，不再构造正则。MIME 形式的条目本地无法从文件名判断，
 * 交给 antd 的原生 accept 与服务端去管，这里跳过而不是误判。
 */
const matchesAccept = (file: { name: string; type?: string }, accept: string) => {
  const items = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!items.length) return true;

  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  // 只要有一条 MIME 规则，就说明调用方是按 MIME 约束的，本地不做后缀判断。
  const extensions = items.filter((i) => i.startsWith("."));
  const mimes = items.filter((i) => !i.startsWith("."));

  if (mimes.some((m) =>
    m.endsWith("/*") ? type.startsWith(m.slice(0, -1)) : type === m
  )) {
    return true;
  }

  if (extensions.some((ext) => name.endsWith(ext))) return true;

  // 只给了 MIME 规则、且文件没带 type（部分浏览器对少见后缀会留空）时不拦，
  // 避免把合法文件误判掉；真正的把关在服务端。
  return extensions.length === 0 && !type;
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

