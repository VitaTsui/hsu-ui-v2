import React, { createContext, useContext, useId } from "react";
import ReactMarkdown, {
  Options as ReactMarkdownProps,
  ExtraProps,
} from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import classNames from "classnames";
import styles from "./index.module.scss";
import "highlight.js/styles/atom-one-dark.min.css";
import "katex/dist/katex.min.css";
import Copy, { CopyProps } from "../../Copy";
import MermaidBlock from "./MermaidBlock";
import ArtifactBlock from "./ArtifactBlock";

/** Code block languages that support Artifacts preview (modeled after Claude Artifacts) */
const ARTIFACT_LANGS = new Set(["html", "svg"]);

/**
 * Recover the plain-text source from code block children: rehype-highlight splits code into
 * nested <span> highlight elements; joining directly yields [object Object], so extract text recursively.
 */
const extractText = (node: React.ReactNode): string => {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
};

/**
 * Copy button config, handed to the code renderer through context rather than a closure so the
 * renderer can stay a module-level component (see CodeBlock).
 */
const CopyPropsContext = createContext<Omit<CopyProps, "id"> | undefined>(
  undefined,
);

/**
 * Fenced code block: mermaid diagram, Artifacts preview, or highlighted code with a copy button.
 *
 * Declared at module scope on purpose. Defining it inline inside MarkdownViews would hand
 * react-markdown a brand-new element type on every render, so React would unmount and remount
 * every code block whenever the markdown re-renders — making the copy button flicker (and losing
 * its "已复制！" state) on each token of streamed content.
 */
const CodeBlock: React.FC<React.ComponentProps<"code"> & ExtraProps> = (
  props,
) => {
  // `node` is react-markdown's hast node — pulled out so it never reaches the DOM
  const { className, children, node: _node, ...codeProps } = props;
  const copyProps = useContext(CopyPropsContext);
  // Stable for the lifetime of the block: regenerating the id on every render would leave the
  // copy button's getElementById lookup pointing at a stale node. Strip ':' so the id stays
  // usable with CSS selectors as well as getElementById.
  const id = `md-code-${useId().replace(/:/g, "")}`;

  const lang = /language-(\w+)/.exec(className || "")?.[1]?.toLowerCase();
  if (!lang) {
    return <code {...codeProps}>{children}</code>;
  }

  const codeText = extractText(children);

  // Mermaid diagrams: render directly as SVG (fall back to code display when streaming output is incomplete)
  if (lang === "mermaid") {
    return <MermaidBlock code={codeText} />;
  }

  const codeView = (
    <div className={classNames(styles.code)}>
      <div className={classNames(styles.nav)}>
        <Copy id={id} md={false} {...copyProps} />
      </div>
      <div className={classNames(styles.content)}>
        <code
          id={id}
          {...codeProps}
          className={classNames(styles.code_content, className)}
        >
          {children}
        </code>
      </div>
    </div>
  );

  // HTML/SVG: Artifacts preview (sandbox iframe) + code tabs
  if (ARTIFACT_LANGS.has(lang)) {
    return <ArtifactBlock code={codeText} lang={lang} codeView={codeView} />;
  }
  return codeView;
};

/** Table cell that turns literal "<br>" text nodes into real line breaks. */
const TableCell: React.FC<React.ComponentProps<"td"> & ExtraProps> = (props) => {
  // `node` is react-markdown's hast node — pulled out so it never reaches the DOM
  const { children, node: _node, ...tdProps } = props;

  return (
    <td {...tdProps}>
      {Array.isArray(children)
        ? children?.map((item, index) =>
            item === "<br>" ? <br key={index} /> : item,
          )
        : children}
    </td>
  );
};

export interface MarkdownViewsProps extends ReactMarkdownProps {
  copyProps?: Omit<CopyProps, "id">;
}

const MarkdownViews: React.FC<MarkdownViewsProps> = (props) => {
  const { className, copyProps, components: extraComponents } = props;

  return (
    // The components map below may be a fresh object each render; that is harmless because the
    // renderers it points at are stable module-level types, which is what React reconciles on.
    <CopyPropsContext.Provider value={copyProps}>
      <ReactMarkdown
        {...props}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        /* `remarkCjkFriendly` 修的是中文里最常见的一处 markdown 失效：
           `我得先知道**「这件事」是什么**` —— 开头那对 `**` 后面跟着 `「`
           （标点）、前面是 `道`（非空白非标点），按 CommonMark 的 flanking 规则
           它不是左侧定界符，于是整段**原样显示两个星号**。
           而中文里「**「…」**」「**《…》**」这种写法极常见，模型输出里到处都是。
           这个插件按 CJK 友好规则重判 flanking，是这条规则的通行修法。 */
        remarkPlugins={[remarkCjkFriendly, remarkGfm, remarkMath]}
        className={classNames(styles.MarkdownViews, className, "markdown-body")}
        components={{
          code: CodeBlock,
          td: TableCell,
          ...(extraComponents || {}),
        }}
      />
    </CopyPropsContext.Provider>
  );
};

export default MarkdownViews;
