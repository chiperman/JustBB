import { describe, expect, it } from "vitest"
import { createDeviceCode, decryptDeviceToken, encryptDeviceToken, hashDeviceCode } from "./device"

describe("CLI 设备授权安全工具", () => {
  it("只保存授权码哈希，不保存原始授权码", () => {
    expect(hashDeviceCode("123456")).not.toContain("123456")
  })

  it("生成六位大写字母数字授权码，并排除易混淆字符", () => {
    const code = createDeviceCode()
    expect(code).toMatch(/^[A-Z2-9]{6}$/)
    expect(code).not.toMatch(/[01IO]/)
  })

  it("可以加密并恢复设备会话令牌", () => {
    const encrypted = encryptDeviceToken("access-token")
    expect(encrypted).not.toContain("access-token")
    expect(decryptDeviceToken(encrypted)).toBe("access-token")
  })
})
