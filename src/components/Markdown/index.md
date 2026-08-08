---
nav: 组件
group:
  title: 数据展示
  order: 4
title: Markdown 渲染
---

# Markdown 渲染

Markdown 渲染与编辑组件，`Markdown.Views` 用于渲染展示（支持 GFM、KaTeX 公式、代码高亮、Mermaid 图与 HTML/SVG Artifacts 预览），`Markdown.Editor` 提供所见即所得编辑器。

## 引入

```ts
import { Markdown } from "@hsu-react/ui";
```

## Markdown 展示

`Markdown.Views` 渲染（依赖 KaTeX / highlight.js / Mermaid 等样式，建议在应用环境内使用）：

```tsx
import React from "react";
import { Markdown } from "@hsu-react/ui";

const content = `# 标题

这是一段包含 **加粗** 文本的说明。

- 列表项一
- 列表项二
- 列表项三

\`\`\`ts
const a = 1;
const b = a + 1;
\`\`\`
`;

export default () => <Markdown.Views>{content}</Markdown.Views>;
```

## Markdown 编辑器

`Markdown.Editor` 编辑：

```tsx
import React from "react";
import { Markdown } from "@hsu-react/ui";

export default () => {
  const [value, setValue] = React.useState("# Hello\n\n开始编辑 **Markdown** 内容吧。");

  return (
    <div style={{ height: 240 }}>
      <Markdown.Editor
        value={value}
        onChange={setValue}
        view={{ menu: true, md: true, html: true }}
      />
    </div>
  );
};
```

## Mermaid 图表

代码块语言标为 `mermaid` 时会渲染成图。语法不完整时（比如流式输出到一半）静默回退成代码块展示。

> 出于安全考虑用的是 mermaid 的默认 `securityLevel: "strict"`：Markdown 渲染的往往是不可信内容（聊天消息、AI 回复、上传的 .md），而 `loose` 会放开 `click` 交互 —— 链接 URL 不过 `sanitizeUrl`，且能经 `runFunc` 调到任意全局函数。图形渲染本身不受影响。

```tsx
import React from "react";
import { Markdown } from "@hsu-react/ui";

const content = `\`\`\`mermaid
flowchart LR
  A[开始] --> B{判断}
  B -->|是| C[处理]
  B -->|否| D[跳过]
  C --> E[结束]
  D --> E
\`\`\``;

export default () => <Markdown.Views>{content}</Markdown.Views>;
```

## API

### Markdown.Views

继承 [react-markdown Options](https://github.com/remarkjs/react-markdown)（markdown 文本通过 `children` 传入），新增属性：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| children | 待渲染的 markdown 文本 | `string` | - |
| copyProps | 代码块复制按钮配置 | `Omit<CopyProps, 'id'>` | - |
| className | 自定义类名 | `string` | - |

### Markdown.Editor

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 编辑器内容 | `string` | `''` |
| onChange | 内容变化回调 | `(value: string) => void` | - |
| buttonGroup | 顶部自定义按钮组 | `ButtonProps[]` | - |
| className | 自定义类名 | `string` | - |
| disabled | 是否禁用 | `boolean` | - |
| readOnly | 是否只读 | `boolean` | - |
| view | 视图区域配置 | `{ menu?: boolean; md?: boolean; html?: boolean }` | `{ menu: true, md: true, html: true }` |
