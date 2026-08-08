// Global configuration (permissions + request injection)
export { default as ConfigProvider } from "./config-provider";
export type { ConfigProviderProps } from "./config-provider";

// Request injection layer
export {
  configureRequest,
  get,
  post,
  del,
  put,
} from "./request";
export type { RequestImpl, RequestConfig, ResType, ListRes, FileRes } from "./request";

// hooks & utils
export { usePermissions, PermissionsContent, useLabelWidth } from "./hooks";
export { getUUID, supportsHasSelector, isLegacyHasSelectorBrowser } from "./utils";

// Design tokens (TS constants for JS-side consumers such as antd themeConfig; CSS-variable version lives in es/styles/tokens.scss)
export { lightTokens, darkTokens, defaultPrimaryColor } from "./styles/tokens";
export type { HsuThemeTokens } from "./styles/tokens";

// Components
export { default as Button } from "./components/Button";
export * from "./components/Button";
export { default as ChainGraph } from "./components/ChainGraph";
export * from "./components/ChainGraph";
export { default as Chart } from "./components/Chart";
export * from "./components/Chart";
export { default as Chat } from "./components/Chat";
export * from "./components/Chat";
export { default as Checkbox } from "./components/Checkbox";
export * from "./components/Checkbox";
export { default as CodeMirror } from "./components/CodeMirror";
export * from "./components/CodeMirror";
export { default as Copy } from "./components/Copy";
export * from "./components/Copy";
export { default as DatePicker } from "./components/DatePicker";
export * from "./components/DatePicker";
export { default as Descriptions } from "./components/Descriptions";
export * from "./components/Descriptions";
export { default as Editor } from "./components/Editor";
export * from "./components/Editor";
export { default as FileCol } from "./components/FileCol";
export * from "./components/FileCol";
export { default as FilePreview } from "./components/FilePreview";
export * from "./components/FilePreview";
export { default as FlexFill } from "./components/FlexFill";
export * from "./components/FlexFill";
export { default as Form } from "./components/Form";
export * from "./components/Form";
export { default as FormItem } from "./components/FormItem";
export * from "./components/FormItem";
export { default as Icon } from "./components/Icon";
export * from "./components/Icon";
export { default as Input } from "./components/Input";
export * from "./components/Input";
export { default as Markdown } from "./components/Markdown";
export * from "./components/Markdown";
export { default as Modal } from "./components/Modal";
export * from "./components/Modal";
export { default as Operate } from "./components/Operate";
export * from "./components/Operate";
export { default as Pagination } from "./components/Pagination";
export * from "./components/Pagination";
export { default as Panel } from "./components/Panel";
export * from "./components/Panel";
export { default as Search } from "./components/Search";
export * from "./components/Search";
export { default as SecondConf } from "./components/SecondConf";
export * from "./components/SecondConf";
export { default as Select } from "./components/Select";
export * from "./components/Select";
export { default as Slider } from "./components/Slider";
export * from "./components/Slider";
export { default as Spreadsheet } from "./components/Spreadsheet";
export * from "./components/Spreadsheet";
export { default as Switch } from "./components/Switch";
export * from "./components/Switch";
export { default as TabBar } from "./components/TabBar";
export * from "./components/TabBar";
export { default as Table } from "./components/Table";
export * from "./components/Table";
export { default as Tags } from "./components/Tags";
export * from "./components/Tags";
export { default as TextEllipsis } from "./components/TextEllipsis";
export * from "./components/TextEllipsis";
export { default as Tree } from "./components/Tree";
export * from "./components/Tree";
export { default as Upload } from "./components/Upload";
export * from "./components/Upload";

// Explicit disambiguation: both Table and Descriptions export ColumnsType; Table's takes precedence (public API).
export type { ColumnsType } from "./components/Table";
