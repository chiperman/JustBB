import { describe, expect, it } from "vitest"
import { isUuid } from "./ids"

describe("isUuid", () => {
  it("接受标准 UUID", () => {
    expect(isUuid("9b0f1e24-76d8-4ef9-a889-81e7e3b0d1b2")).toBe(true)
  })

  it("拒绝非 UUID 字符串，避免数据库类型错误", () => {
    expect(isUuid("not-a-real-id")).toBe(false)
    expect(isUuid("../memos")).toBe(false)
    expect(isUuid("")).toBe(false)
  })
})
