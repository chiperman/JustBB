import { describe, expect, it } from "vitest"
import robots from "./robots"

describe("robots", () => {
  it("只允许公开分享路径，阻止应用内部和认证路径被爬取", () => {
    const config = robots()
    const [rule] = Array.isArray(config.rules) ? config.rules : [config.rules]

    expect(rule.allow).toContain("/share/")
    expect(rule.disallow).toEqual(
      expect.arrayContaining([
        "/api/",
        "/auth/",
        "/forgot-password",
        "/gallery",
        "/map",
        "/reset-password",
        "/tags",
        "/trash",
        "/unauthorized",
      ])
    )
  })
})
