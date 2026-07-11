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
      "--page must be an integer between 1 and 10000"
    )
  })

  it("支持按 Memo 编号查看和 JSON 输出", () => {
    expect(parseCommand(["show", "123", "--json"])).toEqual({
      name: "show",
      options: { memoNumber: "123", json: true, unlock: false },
    })
  })

  it("支持已确认的 Memo 管理与回收站命令", () => {
    expect(parseCommand(["edit", "123"])).toEqual({
      name: "edit",
      options: { memoNumber: "123", json: false },
    })
    expect(parseCommand(["show", "123", "--pin"])).toEqual({
      name: "show",
      options: {
        memoNumber: "123",
        json: false,
        unlock: false,
        action: "pin",
      },
    })
    expect(parseCommand(["trash", "123", "--restore", "--json"])).toEqual({
      name: "trash",
      options: {
        memoNumber: "123",
        action: "restore",
        limit: 20,
        page: 1,
        json: true,
        yes: false,
      },
    })
  })

  it("拒绝 show 的未知或互斥参数", () => {
    expect(() => parseCommand(["show", "123", "--delete", "--pin"])).toThrow(
      "show accepts only one action option"
    )
    expect(() => parseCommand(["show", "123", "--unknown"])).toThrow(
      "Unsupported option: --unknown"
    )
    expect(() => parseCommand(["trash", "123", "--restore", "--purge"])).toThrow(
      "trash accepts only one action option"
    )
  })

  it("支持设备登录、退出和身份查看命令", () => {
    expect(parseCommand(["login"])).toEqual({ name: "login" })
    expect(parseCommand(["logout"])).toEqual({ name: "logout" })
    expect(parseCommand(["whoami"])).toEqual({ name: "whoami" })
  })

  it("根据真实角色展示对应命令", () => {
    expect(formatHelp("guest")).toContain("Browse public Memos without signing in")
    expect(formatHelp("guest")).not.toContain("justmemo publish")

    expect(formatHelp("user")).toContain("Current role: standard user")
    expect(formatHelp("user")).not.toContain("justmemo publish")

    expect(formatHelp("admin")).toContain("Current role: administrator")
    expect(formatHelp("admin")).toContain("justmemo publish")
    expect(formatHelp("admin")).toContain("justmemo trash")
  })
})
