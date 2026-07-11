import { describe, expect, it } from "vitest"
import { parseCommand } from "./commands.js"

describe("CLI command parsing", () => {
  it("支持不加引号的多词搜索和过滤参数", () => {
    expect(parseCommand(["search", "旅行", "上海", "--tag", "生活", "--limit", "50"])).toEqual({
      name: "search",
      options: {
        query: "旅行 上海",
        tag: "生活",
        num: undefined,
        limit: 50,
        json: false,
      },
    })
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
})
