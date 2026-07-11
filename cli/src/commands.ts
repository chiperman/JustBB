import type {
  EditOptions,
  PublishOptions,
  SearchOptions,
  ShowOptions,
  TrashOptions,
} from "./types.js"

export type ParsedCommand =
  | { name: "help" }
  | { name: "login" }
  | { name: "logout" }
  | { name: "whoami" }
  | { name: "publish"; options: PublishOptions }
  | { name: "search"; options: SearchOptions }
  | { name: "show"; options: ShowOptions }
  | { name: "edit"; options: EditOptions }
  | { name: "trash"; options: TrashOptions }

function readOption(args: string[], index: number, name: string) {
  const value = args[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

export function parseCommand(args: string[]): ParsedCommand {
  const [command, ...rest] = args

  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { name: "help" }
  }

  if (command === "login" || command === "logout" || command === "whoami") {
    if (rest.length > 0) throw new Error(`${command} does not accept arguments`)
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
      else if (value.startsWith("--")) throw new Error(`Unsupported option: ${value}`)
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
    let page = 1
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
          throw new Error("--limit must be an integer between 1 and 100")
        }
        index += 1
      } else if (value === "--page") {
        const rawPage = readOption(rest, index, "--page")
        page = Number(rawPage)
        if (!Number.isInteger(page) || page < 1 || page > 10000) {
          throw new Error("--page must be an integer between 1 and 10000")
        }
        index += 1
      } else if (value.startsWith("--")) {
        throw new Error(`Unsupported option: ${value}`)
      } else {
        query.push(value)
      }
    }

    return {
      name: "search",
      options: { query: query.join(" "), tag, num, limit, page, json },
    }
  }

  if (command === "show") {
    const memoNumber = rest.find((value) => !value.startsWith("--"))
    if (!memoNumber) throw new Error("show requires a Memo number")

    const positional = rest.filter((value) => !value.startsWith("--"))
    if (positional.length > 1) throw new Error("show accepts exactly one Memo number")

    const actionValues = rest.filter((value) =>
      ["--edit", "--pin", "--unpin", "--private", "--public", "--delete"].includes(value)
    )
    if (actionValues.length > 1) throw new Error("show accepts only one action option")

    for (const value of rest) {
      if (
        !value.startsWith("--") ||
        value === "--json" ||
        value === "--unlock" ||
        actionValues.includes(value)
      ) {
        continue
      }
      throw new Error(`Unsupported option: ${value}`)
    }

    if (rest.includes("--unlock") && actionValues.length > 0) {
      throw new Error("--unlock cannot be used with a management action")
    }

    return {
      name: "show",
      options: {
        memoNumber,
        json: rest.includes("--json"),
        unlock: rest.includes("--unlock"),
        action: actionValues[0]?.slice(2) as ShowOptions["action"],
      },
    }
  }

  if (command === "edit") {
    if (rest.length !== 1 && !(rest.length === 2 && rest[1] === "--json")) {
      throw new Error("edit requires a Memo number")
    }
    const memoNumber = rest[0]
    if (!memoNumber || memoNumber.startsWith("--")) throw new Error("edit requires a Memo number")
    return { name: "edit", options: { memoNumber, json: rest.includes("--json") } }
  }

  if (command === "trash") {
    let memoNumber: string | undefined
    let action: TrashOptions["action"] = "list"
    let actionCount = 0
    let limit = 20
    let page = 1
    let json = false
    let yes = false

    for (let index = 0; index < rest.length; index += 1) {
      const value = rest[index]
      if (!value.startsWith("--")) {
        if (memoNumber) throw new Error("trash accepts exactly one Memo number")
        memoNumber = value
      } else if (value === "--restore") {
        action = "restore"
        actionCount += 1
      } else if (value === "--purge") {
        action = "purge"
        actionCount += 1
      } else if (value === "--empty") {
        action = "empty"
        actionCount += 1
      } else if (value === "--yes") {
        yes = true
      } else if (value === "--json") {
        json = true
      } else if (value === "--limit") {
        limit = Number(readOption(rest, index, "--limit"))
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
          throw new Error("--limit must be an integer between 1 and 100")
        }
        index += 1
      } else if (value === "--page") {
        page = Number(readOption(rest, index, "--page"))
        if (!Number.isInteger(page) || page < 1 || page > 10000) {
          throw new Error("--page must be an integer between 1 and 10000")
        }
        index += 1
      } else {
        throw new Error(`Unsupported option: ${value}`)
      }
    }

    if (actionCount > 1) throw new Error("trash accepts only one action option")
    if (action === "empty" && memoNumber)
      throw new Error("trash --empty does not accept a Memo number")
    if ((action === "restore" || action === "purge") && !memoNumber) {
      throw new Error(`trash --${action} requires a Memo number`)
    }
    if (action === "list" && memoNumber) action = "show"
    if (action !== "list" && action !== "show" && (limit !== 20 || page !== 1)) {
      throw new Error("Trash actions cannot use pagination options")
    }

    return { name: "trash", options: { memoNumber, action, limit, page, json, yes } }
  }

  throw new Error(`Unsupported command: ${command}`)
}

const BROWSE_COMMANDS = `  justmemo search [keywords...] [--tag tag] [--num number] [--limit count] [--page page] [--json]
  justmemo show <number> [--unlock] [--json]`

export function formatHelp(role: "guest" | "user" | "admin") {
  if (role === "admin") {
    return `JustMemo CLI

Current role: administrator
  justmemo whoami
  justmemo logout
  justmemo publish [content...] [--private] [--pin] [--json]
${BROWSE_COMMANDS}
  justmemo edit <number> [--json]
  justmemo show <number> [--edit|--pin|--unpin|--private|--public|--delete] [--json]
  justmemo trash [<number>] [--restore|--purge|--empty] [--yes] [--limit count] [--page page] [--json]

Private Memos: authors can view them directly; everyone else can temporarily unlock one with justmemo show <number> --unlock.
`
  }

  if (role === "user") {
    return `JustMemo CLI

Current role: standard user (public Memos only)
  justmemo whoami
  justmemo logout
${BROWSE_COMMANDS}

Use justmemo show <number> --unlock to temporarily unlock a private Memo with its access code.
`
  }

  return `JustMemo CLI

Browse public Memos without signing in:
${BROWSE_COMMANDS}

Sign in as an administrator to publish and manage Memos:
  justmemo login

Use justmemo show <number> --unlock to temporarily unlock a private Memo with its access code.
`
}
