import "dayjs/locale/zh-cn";

import React, { ReactNode, useEffect } from "react";

import { ConfigProvider } from "antd";
import { IntlProvider } from "react-intl";
import I18nStore from "./I18nStore";
import { observer } from "mobx-react-lite";

export interface InternationalizationProps {
  children: ReactNode;
  /**
   * 默认语言。仅在本地没有缓存过语言时生效 —— 用户选过一次之后以缓存为准。
   *
   * 原实现是从应用的全局 `Config.locale` 兜底的，那是 build 期注入的 ambient 全局，
   * 组件不该认识它，改由这里传入。
   */
  defaultLocale?: string;
}

const Internationalization: React.FC<InternationalizationProps> = observer(
  ({ children, defaultLocale }) => {
    const { messages, locale, antLocale } = I18nStore;

    // 只在「从未选过语言」时应用默认值，不覆盖用户的选择
    useEffect(() => {
      if (defaultLocale) I18nStore.applyDefaultLocale(defaultLocale);
    }, [defaultLocale]);

    useEffect(() => {
      const html = document.documentElement;
      html.classList.remove("lang-en-US", "lang-zh-CN");
      html.classList.add(`lang-${locale}`);
    }, [locale]);

    return (
      <IntlProvider locale={locale} messages={messages}>
        <ConfigProvider locale={antLocale}>{children}</ConfigProvider>
      </IntlProvider>
    );
  }
);

export default Internationalization;
