import { describe, expect, it } from "vitest";
import { isFieldValidateError } from "./formValidateError";

describe("isFieldValidateError", () => {
  it("认得 antd validateFields 的 reject（按 errorFields 结构，不看文案）", () => {
    expect(
      isFieldValidateError({
        values: { nm: undefined },
        errorFields: [{ name: ["nm"], errors: ["请输入展示名称"] }],
        outOfDate: false,
      })
    ).toBe(true);
  });

  it("文案换成任意语言/任意字段照样认得", () => {
    expect(
      isFieldValidateError({
        errorFields: [{ name: ["code"], errors: ["whatever"] }],
      })
    ).toBe(true);
  });

  it("真错误一律不认：Error / 网络错 / 接口返回 / 空值", () => {
    expect(isFieldValidateError(new Error("Network Error"))).toBe(false);
    expect(isFieldValidateError({ code: 500, msg: "服务器开小差" })).toBe(false);
    expect(isFieldValidateError({ errorFields: "请输入展示名称" })).toBe(false);
    expect(isFieldValidateError(null)).toBe(false);
    expect(isFieldValidateError(undefined)).toBe(false);
    expect(isFieldValidateError("请输入展示名称")).toBe(false);
  });
});
