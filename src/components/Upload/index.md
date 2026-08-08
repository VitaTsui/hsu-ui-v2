---
nav: 组件
group:
  title: 数据录入
  order: 3
title: Upload 上传
---

# Upload 上传

在 antd `Upload` 之上封装，内置普通上传与分片（断点）上传、上传进度、文件列表自定义渲染、下载与文件预览能力。

## 引入

```ts
import { Upload } from "@hsu-react/ui";
```

## 上传

> 演示用的 `action` 为占位地址，真实使用时需替换为可用的上传接口（普通上传用 `action`，分片上传用 `chunkAction` / `mergeChunkAction`）。

```tsx
import React, { useState } from "react";
import { Upload } from "@hsu-react/ui";
import { Button } from "antd";

export default () => {
  const [fileList, setFileList] = useState([]);

  return (
    <Upload
      action="/api/upload"
      data={{ bizType: "demo" }}
      fileList={fileList}
      onChange={({ fileList }) => setFileList(fileList)}
    >
      <Button>点击上传</Button>
    </Upload>
  );
};
```

拖拽上传，通过 `drop` 开启：

```tsx
import React, { useState } from "react";
import { Upload } from "@hsu-react/ui";

export default () => {
  const [fileList, setFileList] = useState([]);

  return (
    <Upload
      drop
      action="/api/upload"
      accept=".zip,.pdf"
      fileList={fileList}
      onChange={({ fileList }) => setFileList(fileList)}
    >
      <p style={{ padding: 16, margin: 0 }}>将文件拖到此处，或点击上传</p>
    </Upload>
  );
};
```

## 子组件

```tsx | pure
Upload.Dragger      // antd 的拖拽上传区
Upload.LIST_IGNORE  // beforeUpload 返回它表示「跳过该文件且不进 fileList」
```

本库的 `Upload` 传 `drop` 属性即可切成拖拽形态；`Upload.Dragger` 是 antd 原生的那个，两者不要混用。

## API

继承 antd [UploadProps](https://ant.design/components/upload-cn)（移除原 `action`、`data` 后重新定义），新增/重写属性如下：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| action | 普通上传地址 | `string` | - |
| data | 上传时附带的额外参数 | `Partial<Record<string, string>>` | - |
| drop | 是否使用拖拽上传 | `true` | - |
| sharding | 是否启用分片上传 | `boolean` | - |
| chunkAction | 分片上传地址 | `string` | - |
| mergeChunkAction | 分片合并地址 | `string` | - |
| chunkNum | 分片并发数 | `number` | `3` |
| size | 文件大小限制（MB） | `number` | - |
| onUploading | 上传中文件列表变化回调 | `(fileList: UploadFile[]) => void` | - |
| onUploadingList | 上传中（含取消器）列表变化回调 | `(list: Record<string, Canceler[]>) => void` | - |
| onUploadSuccess | 单个文件上传成功回调 | `() => void` | - |
| rmFile | 需要从列表中移除的文件标识 | `string` | - |
| listProps | 文件列表项渲染配置（名称、进度、下载、预览、删除等） | `object` | - |
| en | 是否使用英文文案 | `boolean` | - |

> 文件列表项内置下载与预览（依赖 `FilePreview`），可通过 `listProps.itemPreview.formatInfo` / `listProps.itemDownload.formatUrl` 自定义。
