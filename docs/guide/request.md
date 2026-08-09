---
title: 请求层
group:
  title: 指南
  order: 1
order: 4
---

# 请求层

本库不绑定任何 HTTP 客户端。少数「智能组件」（导入表单这类）需要自己发请求，实现由消费方注入。

## 注入

推荐走 [`ConfigProvider`](/components/config-provider)：

```tsx | pure
import { ConfigProvider } from "@hsu-react/ui";
import { get, post, del, put } from "@/utils/request";

<ConfigProvider request={{ get, post, del, put }}>
  <App />
</ConfigProvider>;
```

拿不到 React 树的场合（比如在入口文件里一次性配好）用命令式的：

```ts | pure
import { configureRequest } from "@hsu-react/ui";

configureRequest({ get, post, del, put });
```

只需要给用得到的方法。没注入就调用会抛一句明确的错（"尚未注入 request…"），而不是 `impl.get is not a function`。

## 接口

```ts | pure
interface RequestImpl {
  get<T>(url: string, config?: any): Promise<ResType<T>>;
  post<T>(url: string, data?: any, config?: any): Promise<ResType<T>>;
  del<T>(url: string, config?: any): Promise<ResType<T>>;
  put<T>(url: string, data?: any): Promise<ResType<T>>;
}
```

`config` / `data` 刻意用了宽松类型 —— 各家 axios 封装的签名不完全一样，收紧了反而会让消费方为了过类型去写 `as any`。

## 返回值形状

四个方法都应当返回 `ResType<T>`，另有 `ListRes` / `FileRes` 两个常用形状：

```ts | pure
import type { ResType, ListRes, FileRes } from "@hsu-react/ui";
```

## 也可以直接用

注入之后，这四个方法本身也是导出的，业务里可以直接拿来发请求，省掉再包一层：

```ts | pure
import { get, post } from "@hsu-react/ui";

const res = await get<UserInfo>("/api/user/1");
```
