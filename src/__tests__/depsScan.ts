import fs from "node:fs";
import path from "node:path";

/**
 * 两条防回归守卫（`callbackDepsGuard` / `freshObjectDepsGuard`）共用的源码扫描工具。
 * 只做静态文本扫描，故意不引入 AST 依赖——守卫本身要足够轻，才不会被人嫌慢删掉。
 */

/** 去掉注释再扫描：文档注释里的示例代码不是真实代码，不能算命中 */
export function stripComments(src: string) {
  let out = "";
  let i = 0;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      // 把块注释里的换行原样留下，报出来的行号才对得上
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") out += "\n";
        i++;
      }
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** 遍历 `src/` 下的源码文件；守卫自己的目录不参与扫描 */
export function walkSources(dir: string, out: string[] = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "__tests__") continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkSources(full, out);
    else if (/\.(tsx?|jsx?)$/.test(name) && !/\.test\./.test(name))
      out.push(full);
  }
  return out;
}

/**
 * 找出每个匹配 `hookRe` 的 hook 调用的依赖数组，返回 `[行号, 依赖名, 依赖原文]`。
 * `hookRe` 必须带 `g`，且以 `\(` 结尾（例如 `/use(?:Layout)?Effect\(/g`）。
 *
 * 依赖数组按「调用参数里最后一个顶层 `[...]`，且它后面到 `)` 之间只剩逗号/空白」
 * 来定位。早先用 `/,\s*\[([\s\S]*)\]\s*$/` 正则从**最左**的 `, [` 起贪婪匹配，
 * 回调体里只要出现一次 `, [`（JSX 的 `classNames(x, { [styles.a]: b })` 就会），
 * 真正的依赖数组就被并进同一段，切出来的是带换行的 JSX 碎片而不是标识符 ——
 * 结果是真命中被静默漏掉。这里改成括号配平扫描，不再漏。
 */
export function hookDeps(
  src: string,
  hookRe: RegExp,
): Array<[number, string, string]> {
  const found: Array<[number, string, string]> = [];
  const re = new RegExp(hookRe.source, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(src))) {
    const start = m.index + m[0].length;
    let i = start;
    let depth = 1;
    let quote: string | null = null;
    let prev = "";
    /** 调用参数里所有顶层 `[...]` 的起止下标 */
    const topArrays: Array<[number, number]> = [];
    let openAt = -1;

    while (i < src.length && depth > 0) {
      const c = src[i];
      if (quote) {
        if (c === quote && prev !== "\\") quote = null;
      } else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "(" || c === "[" || c === "{") {
        if (depth === 1 && c === "[") openAt = i;
        depth++;
      } else if (c === ")" || c === "]" || c === "}") {
        depth--;
        if (depth === 1 && c === "]" && openAt >= 0) {
          topArrays.push([openAt, i]);
          openAt = -1;
        }
      }
      prev = c;
      i++;
    }

    const closeParen = i - 1;
    const deps = topArrays[topArrays.length - 1];
    // 依赖数组必须是最后一个实参：前面紧邻一个顶层逗号（把 `useMemo(() => [x])`
    // 这种「返回数组、根本没依赖数组」的写法排除掉），后面到 `)` 只剩逗号与空白
    if (!deps) continue;
    if (!/,\s*$/.test(src.slice(start, deps[0]))) continue;
    if (!/^\s*,?\s*$/.test(src.slice(deps[1] + 1, closeParen))) continue;

    const line = src.slice(0, m.index).split("\n").length;
    for (const raw of splitTopLevel(src.slice(deps[0] + 1, deps[1]))) {
      const expr = raw.replace(/\/\/.*$/gm, "").trim();
      if (!expr) continue;
      const name = expr.split(/[.?[(!]/)[0].trim();
      if (name) found.push([line, name, expr]);
    }
  }

  return found;
}

/** 按顶层逗号切分（括号/引号内部的逗号不算） */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let prev = "";
  let cur = "";

  for (const c of text) {
    if (quote) {
      if (c === quote && prev !== "\\") quote = null;
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(cur);
      cur = "";
      prev = c;
      continue;
    }
    cur += c;
    prev = c;
  }
  parts.push(cur);
  return parts;
}

/**
 * 找出「每次渲染都会新建一个对象/数组」的解构绑定，返回 `绑定名 → 说明`。
 *
 * 两种形态：
 * - rest 包：`const { a, ...rest } = props` —— `rest` 每次都是新对象；
 * - 字面量默认值：`const { list = [] } = props` —— 消费方没传时每次都是新数组。
 */
export function freshObjectBindings(src: string): Map<string, string> {
  const found = new Map<string, string>();

  const re = /\b(?:const|let|var)\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src))) {
    // 取出与 `{` 配对的那一段解构模式
    let i = re.lastIndex;
    let depth = 1;
    let quote: string | null = null;
    let prev = "";
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (quote) {
        if (c === quote && prev !== "\\") quote = null;
      } else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      prev = c;
      i++;
    }
    // 后面必须紧跟 `=`，否则不是解构赋值
    if (!/^\s*=/.test(src.slice(i))) continue;

    const pattern = src.slice(re.lastIndex, i - 1);

    for (const r of pattern.matchAll(/\.\.\.\s*([A-Za-z_$][\w$]*)/g)) {
      found.set(r[1], "rest 解构包：每次渲染都是新对象");
    }
    for (const r of pattern.matchAll(
      /([A-Za-z_$][\w$]*)\s*=\s*(?:[[{])/g,
    )) {
      found.set(r[1], "解构默认值是对象/数组字面量：不传时每次渲染都是新对象");
    }
  }

  return found;
}
