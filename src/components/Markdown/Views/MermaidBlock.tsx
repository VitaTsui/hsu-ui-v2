import React, { useEffect, useMemo, useState } from "react";

import { generateRandomStr } from "hsu-utils";
import styles from "./blocks.module.scss";

// mermaid is large; lazy-load it and initialize globally only once
let mermaidPromise: Promise<typeof import("mermaid")["default"]> | null = null;
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        // mermaid 默认就是 strict，这里此前改成了 loose。改回来的原因：
        //
        // Markdown 渲染的是不可信内容 —— Chat 的用户消息、AI 回复、以及 FilePreview 打开的
        // .md 文件，任何一处都能塞一段 ```mermaid。而 loose 恰好放开了两个交互面
        // （mermaid 源码 chunk-ICXQ74PX / chunk-V7JOEXUC）：
        //
        //   formatUrl:    if (securityLevel !== "loose") return sanitizeUrl(url);
        //   setClickFunc: if (securityLevel !== "loose") return;
        //
        // 即 loose 下 `click A "javascript:..."` 的 URL 不过 sanitizeUrl，
        // `click A call fn()` 还能经 runFunc 沿 window[...] 调到任意全局函数。
        // 图本身的标签文本倒是不受影响 —— 那条路径无论哪个 level 都会过 DOMPurify。
        //
        // strict 下这两条都关掉，图形渲染不受影响；本库也从未对外暴露过 mermaid 的交互能力。
        securityLevel: "strict",
        theme: "neutral",
      });
      return m.default;
    });
  }
  return mermaidPromise;
};

export interface MermaidBlockProps {
  code: string;
}

/**
 * Mermaid diagram rendering block (modeled after the flowchart rendering in Claude/Kimi etc.):
 * shows SVG on successful render; silently falls back to code display when the syntax is incomplete (e.g. during streaming).
 */
const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const id = useMemo(() => `mmd-${generateRandomStr(8)}`, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      loadMermaid()
        .then((mermaid) => mermaid.render(id, code))
        .then(({ svg: rendered }) => {
          if (!cancelled) setSvg(rendered);
        })
        .catch(() => {
          // Incomplete code during streaming is normal; fall back to code display
          if (!cancelled) setSvg(null);
          // A failed mermaid.render leaves an error placeholder node in the DOM; clean it up
          document.getElementById(`d${id}`)?.remove();
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [code, id]);

  if (!svg) {
    return (
      <pre className={styles.mermaidFallback}>
        <code>{code}</code>
      </pre>
    );
  }
  return (
    <div
      className={styles.mermaid}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidBlock;
