/**
 * antd（rc-field-form）的 `form.validateFields()` 在**校验不通过时 reject**。
 * 调用方如果只挂 `.then(...)`、不接这条 reject，界面虽然正确拦住了（字段红字也出来了），
 * 浏览器仍会抛一条 `unhandledrejection`——看起来像"提交时崩了一下"，实际什么都没坏。
 *
 * reject 出来的是结构化的 `ValidateErrorEntity`：`{ values, errorFields, outOfDate }`，
 * 其中 `errorFields` 是 `{ name, errors }[]`。
 *
 * **判定按结构走，不按 `message` 文案匹配**：文案随字段、随 `requiredMsg`、随语言变，
 * 拿"请输入…"去匹配等于把一条业务规则写死成字符串，换个字段就失效。
 * 网络错、接口 500、代码 bug 抛出来的对象都没有 `errorFields`，因此一律判为"真错误"，
 * 由调用方继续往上抛——这个判据只认校验失败，不会顺手吞掉别的异常。
 */
export interface FieldValidateError {
  errorFields: { name: (string | number)[]; errors: string[] }[];
  values?: unknown;
  outOfDate?: boolean;
}

/** 这个被 reject 出来的东西是不是「表单校验没通过」 */
export const isFieldValidateError = (e: unknown): e is FieldValidateError =>
  typeof e === "object" &&
  e !== null &&
  Array.isArray((e as { errorFields?: unknown }).errorFields);
