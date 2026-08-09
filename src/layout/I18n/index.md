---
title: I18n 国际化
order: 6
---

# I18n 国际化

react-intl 的 `IntlProvider` 与 antd `locale` 的组合，内置中英两套。

## 引入

```ts
import Layout from "@hsu-react/ui/es/layout";

<Layout.I18n defaultLocale="zh-CN">{children}</Layout.I18n>;
```

## 说明

组件做三件事：

1. 提供 `IntlProvider`，业务里可以照常用 `useIntl()` / `<FormattedMessage />`
2. 同步 antd 的 `locale`（日期选择器、分页、空态这些的内建文案）与 dayjs 的语言
3. 在 `html` 上打 `lang-zh-CN` / `lang-en-US` 类名，供需要按语言微调排版的样式使用

语言持久化在 `localStorage["hsu-ui:lang"]`。`defaultLocale` **只在从未选过语言时生效** —— 用户手动切过之后以缓存为准，不会被默认值覆盖回去。

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| children | 子节点 | `ReactNode` | - |
| defaultLocale | 默认语言，仅在无缓存时生效 | `string` | `"zh-CN"` |

## I18nStore

```ts | pure
import Layout from "@hsu-react/ui/es/layout";

Layout.I18nStore.locale;                    // "zh-CN" | "en-US"
Layout.I18nStore.setLocale("en-US");        // 切换语言，并写入 localStorage
Layout.I18nStore.formatMessage({ id: "x" }); // 在 React 组件之外取文案
```

`formatMessage` 是为了在 store / 工具函数这类拿不到 hook 的地方取文案而暴露的；组件内部仍然优先用 `useIntl()`。
