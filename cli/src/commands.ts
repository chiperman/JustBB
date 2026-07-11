import type { PublishOptions, SearchOptions, ShowOptions } from "./types.js"

export type ParsedCommand =
  | { name: "help" }
  | { name: "login" }
  | { name: "logout" }
  | { name: "whoami" }
  | { name: "publish"; options: PublishOptions }
  | { name: "search"; options: SearchOptions }
  | { name: "show"; options: ShowOptions }

function readOption(args: string[], index: number, name: string) {
  const value = args[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} 需要一个值`)
  }
  return value
}

export function parseCommand(args: string[]): ParsedCommand {
  const [command, ...rest] = args

  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { name: "help" }
  }

  if (command === "login" || command === "logout" || command === "whoami") {
    if (rest.length > 0) throw new Error(`${command} 不接受参数`)
    return { name: command }
  }

  if (command === "publish") {
    const content: string[] = []
    let isPrivate = false
    let isPinned = false
    let json = false

    for (const value of rest) {
      if (value === "--private") isPrivate = true
      else if (value === "--pin") isPinned = true
      else if (value === "--json") json = true
      else if (value.startsWith("--")) throw new Error(`不支持的参数：${value}`)
      else content.push(value)
    }

    return {
      name: "publish",
      options: { content: content.join(" "), isPrivate, isPinned, json },
    }
  }

  if (command === "search") {
    const query: string[] = []
    let tag: string | undefined
    let num: string | undefined
    let limit = 20
    let json = false

    for (let index = 0; index < rest.length; index += 1) {
      const value = rest[index]
      if (value === "--json") {
        json = true
      } else if (value === "--tag") {
        tag = readOption(rest, index, "--tag")
        index += 1
      } else if (value === "--num") {
        num = readOption(rest, index, "--num")
        index += 1
      } else if (value === "--limit") {
        const rawLimit = readOption(rest, index, "--limit")
        limit = Number(rawLimit)
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
          throw new Error("--limit 必须是 1-100 之间的整数")
        }
        index += 1
      } else if (value.startsWith("--")) {
        throw new Error(`不支持的参数：${value}`)
      } else {
        query.push(value)
      }
    }

    return {
      name: "search",
      options: { query: query.join(" "), tag, num, limit, json },
    }
  }

  if (command === "show") {
    const memoNumber = rest.find((value) => !value.startsWith("--"))
    if (!memoNumber) throw new Error("show 需要 Memo 编号")

    return {
      name: "show",
      options: {
        memoNumber,
        json: rest.includes("--json"),
        unlock: rest.includes("--unlock"),
      },
    }
  }

  throw new Error(`暂不支持的命令：${command}`)
}

export const HELP_TEXT = `JustMemo CLI

用法：
  justmemo login
  justmemo logout
  justmemo whoami
  justmemo publish [正文...] [--private] [--pin] [--json]
  justmemo search [关键词...] [--tag 标签] [--num 编号] [--limit 数量] [--json]
  justmemo show <编号> [--unlock] [--json]

当前无需登录即可搜索和查看公开 Memo。
私密 Memo 使用 justmemo show <编号> --unlock 临时输入该 Memo 的口令解锁。
`
