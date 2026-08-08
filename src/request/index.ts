import type { ResType } from "./ResType";

export * from "./ResType";

/** Request configuration (a subset compatible with common axios wrappers) */
export interface RequestConfig<P = object> {
  params?: P;
  responseType?: string;
  headers?: Record<string, unknown>;
  /** When true, a 401 on this request does not trigger the global redirect to login */
  skipAuthRedirect?: boolean;
  [key: string]: unknown;
}

/**
 * Request implementation interface that the library's internal "smart components" depend on.
 * Injected by consumers via ConfigProvider's `request` or `configureRequest()`;
 * the component library itself is not bound to any specific HTTP client.
 */
// Note: config/data use loose types to accommodate signature differences across axios wrappers
export interface RequestImpl {
  get<T = unknown>(url: string, config?: any): Promise<ResType<T>>;
  post<T = unknown>(url: string, data?: any, config?: any): Promise<ResType<T>>;
  del<T = unknown>(url: string, config?: any): Promise<ResType<T>>;
  put<T = unknown>(url: string, data?: any): Promise<ResType<T>>;
}

const notConfigured = (): never => {
  throw new Error(
    "[@hsu-react/ui] 尚未注入 request。请用 <ConfigProvider request={...}> 包裹应用，" +
      "或在入口调用 configureRequest({ get, post, del, put })。",
  );
};

let impl: RequestImpl = {
  get: notConfigured,
  post: notConfigured,
  del: notConfigured,
  put: notConfigured,
};

/** Inject the real request implementation (only the methods you use need to be provided) */
export const configureRequest = (request: Partial<RequestImpl>): void => {
  // 过滤 undefined：`configureRequest({ get: undefined })` 会把键写进去、值为 undefined，
  // 从而覆盖掉上面那个抛错兜底 —— 调用时报的就成了 "impl.get is not a function"，
  // 而不是那句告诉你「忘了注入 request」的提示。
  const provided = Object.fromEntries(
    Object.entries(request).filter(([, fn]) => typeof fn === "function")
  ) as Partial<RequestImpl>;

  impl = { ...impl, ...provided } as RequestImpl;
};

export const get: RequestImpl["get"] = (url, config) => impl.get(url, config);
export const post: RequestImpl["post"] = (url, data, config) =>
  impl.post(url, data, config);
export const del: RequestImpl["del"] = (url, config) => impl.del(url, config);
export const put: RequestImpl["put"] = (url, data) => impl.put(url, data);
