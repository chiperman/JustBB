import { describe, expect, it } from "vitest"
import {
  CLI_DEFAULT_LIMIT,
  CLI_DEFAULT_PAGE,
  CLI_ERROR_CODES,
  cliError,
  cliOk,
  isValidMemoNumber,
  parseCliLimit,
  parseCliPage,
} from "./http"

describe("cliOk", () => {
  it("返回统一成功形态，不带 code 字段", async () => {
    const response = cliOk({ memo_number: 1 })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: { memo_number: 1 },
      error: null,
    })
  })
})

describe("cliError", () => {
  it("返回统一错误形态并携带机器可读 code", async () => {
    const response = cliError("权限不足", 403, CLI_ERROR_CODES.ADMIN_ONLY)
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      success: false,
      data: null,
      error: "权限不足",
      code: "ADMIN_ONLY",
    })
  })
})

describe("parseCliLimit / parseCliPage", () => {
  it("缺省返回默认值", () => {
    expect(parseCliLimit(null)).toBe(CLI_DEFAULT_LIMIT)
    expect(parseCliLimit("")).toBe(CLI_DEFAULT_LIMIT)
    expect(parseCliPage(null)).toBe(CLI_DEFAULT_PAGE)
    expect(parseCliPage("")).toBe(CLI_DEFAULT_PAGE)
  })

  it("接受合法整数", () => {
    expect(parseCliLimit("50")).toBe(50)
    expect(parseCliPage("3")).toBe(3)
  })

  it("拒绝越界、小数和非数字", () => {
    expect(parseCliLimit("0")).toBeNull()
    expect(parseCliLimit("101")).toBeNull()
    expect(parseCliLimit("1.5")).toBeNull()
    expect(parseCliLimit("abc")).toBeNull()
    expect(parseCliPage("0")).toBeNull()
    expect(parseCliPage("10001")).toBeNull()
    expect(parseCliPage("abc")).toBeNull()
  })
})

describe("isValidMemoNumber", () => {
  it("接受正整数编号", () => {
    expect(isValidMemoNumber("1")).toBe(true)
    expect(isValidMemoNumber("123")).toBe(true)
  })

  it("拒绝零、负数、小数和非数字", () => {
    expect(isValidMemoNumber("0")).toBe(false)
    expect(isValidMemoNumber("-1")).toBe(false)
    expect(isValidMemoNumber("1.5")).toBe(false)
    expect(isValidMemoNumber("abc")).toBe(false)
    expect(isValidMemoNumber("")).toBe(false)
  })
})
