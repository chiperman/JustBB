#!/usr/bin/env node

import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { parseCommand, HELP_TEXT } from "./commands.js"
import {
  getCliCurrentUser,
  pollDeviceAuth,
  publishMemo,
  searchMemos,
  showMemo,
  startDeviceAuth,
  unlockMemo,
} from "./client.js"
import { formatLogin, formatPublish, formatSearch, formatShow, formatWhoami } from "./output.js"
import { promptSecret } from "./prompt.js"
import { promptText } from "./prompt.js"
import { clearSession, writeSession } from "./auth-store.js"
import { editText } from "./editor.js"
import { preparePublishContent } from "./content.js"
import { openBrowser } from "./browser.js"

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value)}\n`)
}

export async function run(args: string[]) {
  try {
    const command = parseCommand(args)

    if (command.name === "help") {
      process.stdout.write(HELP_TEXT)
      return 0
    }

    if (command.name === "logout") {
      await clearSession()
      process.stdout.write("justmemo logout success\n")
      return 0
    }

    if (command.name === "whoami") {
      const result = await getCliCurrentUser()
      if (result.data) {
        process.stdout.write(
          `${formatWhoami(result.data.email || result.data.id, result.data.role)}\n`
        )
      }
      return 0
    }

    if (command.name === "login") {
      const result = await startDeviceAuth()
      if (!result.data) throw new Error("无法创建授权请求")

      const browserOpened = openBrowser(result.data.authorize_url)
      process.stdout.write(
        `${formatLogin({ authorizeUrl: result.data.authorize_url, code: result.data.code, browserOpened })}\n`
      )

      const expiresAt = new Date(result.data.expires_at).getTime()
      while (Date.now() < expiresAt) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const poll = await pollDeviceAuth(result.data.request_id, result.data.code)
        if (poll.data?.status === "approved") {
          await writeSession({
            access_token: poll.data.access_token,
            refresh_token: poll.data.refresh_token,
          })
          process.stdout.write("justmemo login success\n")
          return 0
        }
      }

      throw new Error("授权超时，请重新执行 justmemo login")
    }

    if (command.name === "publish") {
      const rawContent = command.options.content || (await editText(""))
      const prepared = preparePublishContent(rawContent)
      if (!prepared.content && prepared.images.length === 0) {
        throw new Error("内容不能为空")
      }

      let accessCode: string | undefined
      let accessCodeHint: string | undefined
      if (command.options.isPrivate) {
        accessCodeHint = await promptText("口令提示（可留空）：")
        while (true) {
          const firstCode = await promptSecret("访问口令：")
          if (!firstCode) throw new Error("私密 Memo 必须设置访问口令")

          const confirmation = await promptSecret("再次输入访问口令：")
          if (firstCode === confirmation) {
            accessCode = firstCode
            break
          }

          process.stdout.write("两次口令不一致，请重新输入。\n")
        }
      }

      const result = await publishMemo({
        content: prepared.content,
        images: prepared.images,
        is_private: command.options.isPrivate,
        is_pinned: command.options.isPinned,
        access_code: accessCode,
        access_code_hint: accessCodeHint,
      })
      if (command.options.json) writeJson(result)
      else process.stdout.write(`${formatPublish(result.data?.memo_number)}\n`)
      return 0
    }

    if (command.name === "search") {
      const result = await searchMemos(command.options)
      if (command.options.json) writeJson(result)
      else process.stdout.write(`${formatSearch(result.data || [])}\n`)
      return 0
    }

    let result = await showMemo(command.options.memoNumber)
    if (command.options.unlock && result.data?.is_locked) {
      if (result.data.access_code_hint) {
        process.stdout.write(`口令提示：${result.data.access_code_hint}\n`)
      }
      const code = await promptSecret("请输入解锁口令：")
      result = await unlockMemo(command.options.memoNumber, code)
    }
    if (command.options.json) writeJson(result)
    else process.stdout.write(`${formatShow(result.data as NonNullable<typeof result.data>)}\n`)
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误"
    process.stderr.write(`${message}\n`)
    return 1
  }
}

const isCliEntrypoint =
  process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])

if (isCliEntrypoint) {
  run(process.argv.slice(2)).then((code) => {
    process.exitCode = code
  })
}
