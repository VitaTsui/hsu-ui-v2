import { IntlFormatters, createIntl, createIntlCache } from "react-intl";

import { Locale } from "antd/lib/locale";
import enUS from "antd/locale/en_US";
import en_US from "./locales/en-US";
import { makeAutoObservable } from "mobx";
import zhCN from "antd/locale/zh_CN";
import zh_CN from "./locales/zh-CN";
import { readStorage, writeStorage, STORAGE_KEY } from "../_utils/storage";

type MessagesType = Record<string, string>;

type FormatMessage = IntlFormatters["formatMessage"];

export interface LocaleOption {
  label: string;
  value: string;
}
export const LocaleOptions: LocaleOption[] = [
  { label: "中文简体", value: "zh-CN" },
  { label: "English", value: "en-US" },
];

class I18n {
  get locale() {
    return this._locale;
  }
  private _locale: string = "zh-CN";

  get messages() {
    return this._messages;
  }
  private _messages: MessagesType = zh_CN;

  get antLocale() {
    return this._antLocale;
  }
  private _antLocale: Locale = zhCN;

  // 显式标注返回类型。不标的话 TS 会把它推断成 react-intl 内部依赖里的类型，
  // 生成的 d.ts 就会带上 `react-intl/node_modules/intl-messageformat` 这种路径 ——
  // 在消费方那边（依赖扁平化后位置不同）解析不到。发包才会暴露的问题。
  get formatMessage(): FormatMessage {
    return this._formatMessage;
  }
  private _formatMessage!: FormatMessage;

  constructor() {
    makeAutoObservable(this);
    // 原本兜底读的是应用的全局 Config.locale。那是消费方 build 期注入的 ambient 全局，
    // 组件不该认识它 —— 默认语言改由 <Layout.I18n defaultLocale> 传入。
    this.setLocale(readStorage(STORAGE_KEY.LANG) || "zh-CN");
  }

  /**
   * 应用默认语言：只在本地从未缓存过语言时生效，不覆盖用户已经做过的选择。
   * 由 `<Layout.I18n defaultLocale>` 调用。
   */
  public applyDefaultLocale = (locale: string) => {
    if (!readStorage(STORAGE_KEY.LANG)) this.setLocale(locale);
  };

  public setLocale = (locale: string = "zh-CN") => {
    this._locale = locale;

    writeStorage(STORAGE_KEY.LANG, locale);

    switch (locale) {
      case "en-US":
        this._antLocale = enUS;
        this._messages = en_US;
        break;
      default:
        this._antLocale = zhCN;
        this._messages = zh_CN;
        break;
    }

    this._setFormatMessage();
  };

  private _setFormatMessage = () => {
    const cache = createIntlCache();

    const intl = createIntl(
      {
        locale: this._locale,
        messages: this._messages,
      },
      cache
    );

    this._formatMessage = intl.formatMessage;
  };
}

const I18nStore = new I18n();
export default I18nStore;
