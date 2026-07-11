import { describe, expect, it } from "vitest"
import { formatHelp, parseCommand } from "./commands.js"

describe("CLI command parsing", () => {
  it("支持不加引号的多词搜索和过滤参数", () => {
    expect(
      parseCommand(["search", "旅行", "上海", "--tag", "生活", "--limit", "50", "--page", "3"])
    ).toEqual({
      name: "search",
      options: {
        query: "旅行 上海",
        tag: "生活",
        num: undefined,
        limit: 50,
        page: 3,
        json: false,
      },
    })
  })

  it("拒绝无效页码", () => {
    expect(() => parseCommand(["search", "--page", "0"])).toThrow(
      "--page 必须是 1-10000 之间的整数"
    )
  })

  it("支持按 Memo 编号查看和 JSON 输出", () => {
    expect(parseCommand(["show", "123", "--json"])).toEqual({
      name: "show",
      options: { memoNumber: "123", json: true, unlock: false },
    })
  })

  it("支持设备登录、退出和身份查看命令", () => {
    expect(parseCommand(["login"])).toEqual({ name: "login" })
    expect(parseCommand(["logout"])).toEqual({ name: "logout" })
    expect(parseCommand(["whoami"])).toEqual({ name: "whoami" })
  })

  it("根据登录状态展示对应命令", () => {
    expect(formatHelp(false)).toContain("无需登录即可浏览公开 Memo")
    expect(formatHelp(false)).not.toContain("justmemo publish")

    expect(formatHelp(true)).toContain("已登录，可浏览 Memo；管理员可发布")
    expect(formatHelp(true)).toContain("justmemo publish")
    expect(formatHelp(true)).not.toContain("justmemo login")
  })
})
