#!/usr/bin/env node

import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { formatHelp, parseCommand } from "./commands.js"
import {
  getCliCurrentUser,
  deleteMemo,
  emptyTrash,
  listTrash,
  pollDeviceAuth,
  purgeTrashMemo,
  publishMemo,
  restoreTrashMemo,
  searchMemos,
  showMemo,
  showTrashMemo,
  startDeviceAuth,
  updateMemo,
  unlockMemo,
} from "./client.js"
import { formatLogin, formatPublish, formatSearch, formatShow, formatWhoami } from "./output.js"
import { confirmDangerousAction, promptEnter, promptSecret, promptText } from "./prompt.js"
import { clearSession, readSession, writeSession } from "./auth-store.js"
import { editText } from "./editor.js"
import { preparePublishContent } from "./content.js"
import { openBrowser } from "./browser.js"

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value)}\n`)
}

async function readPublishContent(content: string) {
  if (content) return content
  if (!process.stdin.isTTY) {
    let input = ""
    for await (const chunk of process.stdin) input += chunk
    return input
  }
  return editText("")
}

const IMAGE_SECTION = "\n\n--- Image URLs (one per line) ---\n"

function editableMemoContent(content: string, images: string[] | null | undefined) {
  return `${content}${IMAGE_SECTION}${(images || []).join("\n")}\n`
}

function parseEditedMemo(input: string) {
  const markerIndex = input.lastIndexOf(IMAGE_SECTION)
  if (markerIndex < 0) return { content: input.trim(), images: [] }

  return {
    content: input.slice(0, markerIndex).trim(),
    images: input
      .slice(markerIndex + IMAGE_SECTION.length)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  }
}

async function privateMemoInput(json = false) {
  let accessCode: string
  const output = json ? process.stderr : process.stdout
  const secret = (label: string) => (json ? promptSecret(label, true) : promptSecret(label))
  const text = (label: string) => (json ? promptText(label, true) : promptText(label))
  while (true) {
    const firstCode = await secret("Access code: ")
    if (!firstCode) throw new Error("Private Memos require an access code.")

    const confirmation = await secret("Confirm access code: ")
    if (firstCode === confirmation) {
      accessCode = firstCode
      break
    }

    output.write("Access codes do not match. Try again.\n")
  }
  const accessCodeHint = await text("Access code hint (optional): ")
  return { accessCode, accessCodeHint }
}

async function resolveHelpRole() {
  if (!(await readSession())) return "guest" as const
  try {
    const result = await getCliCurrentUser()
    return result.data?.role === "admin" ? ("admin" as const) : ("user" as const)
  } catch {
    return "guest" as const
  }
}

async function editMemo(
  memoNumber: string,
  json: boolean,
  prefetched?: Awaited<ReturnType<typeof showMemo>>
) {
  const current = prefetched ? prefetched.data : (await showMemo(memoNumber)).data
  if (!current || current.is_locked) throw new Error("Cannot edit a locked private Memo.")
  if (!json && prefetched) process.stdout.write(`${formatShow(current)}\n`)

  const edited = parseEditedMemo(
    await editText(editableMemoContent(current.content, current.images))
  )
  const prepared = preparePublishContent(edited.content)
  const images = Array.from(new Set([...edited.images, ...prepared.images]))
  if (!prepared.content && images.length === 0) throw new Error("Content cannot be empty.")

  const result = await updateMemo(memoNumber, { content: prepared.content, images })
  if (json) writeJson(result)
  else process.stdout.write(`Updated Memo #${result.data?.memo_number}\n`)
}

export async function run(args: string[]) {
  const wantsJson = args.includes("--json")
  try {
    const command = parseCommand(args)

    if (command.name === "help") {
      process.stdout.write(formatHelp(await resolveHelpRole()))
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
      if (!result.data) throw new Error("Could not create an authorization request.")

      process.stdout.write(
        `${formatLogin({ authorizeUrl: result.data.authorize_url, code: result.data.code })}\n\n`
      )
      if (await promptEnter("Press ENTER to open in your browser...")) {
        if (!openBrowser(result.data.authorize_url)) {
          process.stderr.write("Could not open the browser. Open the URL above manually.\n")
        }
      }
      process.stdout.write("Waiting for browser authorization...\n")

      const expiresAt = new Date(result.data.expires_at).getTime()
      const delays = [1000, 2000, 3000, 5000]
      let pollCount = 0
      let consecutiveErrors = 0
      while (Date.now() < expiresAt) {
        const delay = delays[Math.min(pollCount, delays.length - 1)]
        await new Promise((resolve) => setTimeout(resolve, delay))
        pollCount += 1
        try {
          const poll = await pollDeviceAuth(result.data.request_id, result.data.code)
          consecutiveErrors = 0
          if (poll.data?.status === "approved") {
            await writeSession({
              access_token: poll.data.access_token,
              refresh_token: poll.data.refresh_token,
            })
            process.stdout.write("justmemo login success\n")
            return 0
          }
        } catch (pollError) {
          if (
            pollError instanceof Error &&
            pollError.message === "CLI access is restricted to administrators."
          ) {
            throw pollError
          }
          consecutiveErrors += 1
          if (consecutiveErrors >= 3) throw pollError
        }
      }

      throw new Error("Authorization timed out. Run justmemo login again.")
    }

    if (command.name === "publish") {
      const rawContent = await readPublishContent(command.options.content)
      const prepared = preparePublishContent(rawContent)
      if (!prepared.content && prepared.images.length === 0) {
        throw new Error("Content cannot be empty.")
      }

      let accessCode: string | undefined
      let accessCodeHint: string | undefined
      if (command.options.isPrivate) {
        const privateInput = await privateMemoInput(command.options.json)
        accessCode = privateInput.accessCode
        accessCodeHint = privateInput.accessCodeHint
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

    if (command.name === "edit") {
      await editMemo(command.options.memoNumber, command.options.json)
      return 0
    }

    if (command.name === "trash") {
      if (command.options.action === "list") {
        const result = await listTrash(command.options.limit, command.options.page)
        if (command.options.json) writeJson(result)
        else process.stdout.write(`${formatSearch(result.data || [])}\n`)
        return 0
      }

      if (command.options.action === "show") {
        const result = await showTrashMemo(command.options.memoNumber as string)
        if (command.options.json) writeJson(result)
        else process.stdout.write(`${formatShow(result.data as NonNullable<typeof result.data>)}\n`)
        return 0
      }

      if (command.options.action === "restore") {
        const result = await restoreTrashMemo(command.options.memoNumber as string)
        if (command.options.json) writeJson(result)
        else process.stdout.write(`Restored Memo #${result.data?.memo_number}\n`)
        return 0
      }

      if (command.options.action === "purge") {
        if (
          !command.options.yes &&
          !(await confirmDangerousAction(
            "This cannot be undone. Permanently delete this Memo?",
            command.options.json
          ))
        ) {
          throw new Error("Cancelled.")
        }
        const result = await purgeTrashMemo(command.options.memoNumber as string)
        if (command.options.json) writeJson(result)
        else process.stdout.write(`Permanently deleted Memo #${result.data?.memo_number}\n`)
        return 0
      }

      if (
        !command.options.yes &&
        !(await confirmDangerousAction(
          "This cannot be undone. Empty the Trash?",
          command.options.json
        ))
      ) {
        throw new Error("Cancelled.")
      }
      const result = await emptyTrash()
      if (command.options.json) writeJson(result)
      else process.stdout.write(`Emptied Trash (${result.data?.deleted_count || 0} Memos)\n`)
      return 0
    }

    if (command.options.action === "edit") {
      const fetched = await showMemo(command.options.memoNumber)
      await editMemo(command.options.memoNumber, command.options.json, fetched)
      return 0
    }
    if (command.options.action === "pin" || command.options.action === "unpin") {
      const result = await updateMemo(command.options.memoNumber, {
        is_pinned: command.options.action === "pin",
      })
      if (command.options.json) writeJson(result)
      else
        process.stdout.write(
          `${command.options.action === "pin" ? "Pinned" : "Unpinned"} Memo #${result.data?.memo_number}\n`
        )
      return 0
    }
    if (command.options.action === "private") {
      const privateInput = await privateMemoInput(command.options.json)
      const result = await updateMemo(command.options.memoNumber, {
        is_private: true,
        access_code: privateInput.accessCode,
        access_code_hint: privateInput.accessCodeHint,
      })
      if (command.options.json) writeJson(result)
      else process.stdout.write(`Made Memo #${result.data?.memo_number} private\n`)
      return 0
    }
    if (command.options.action === "public") {
      const result = await updateMemo(command.options.memoNumber, { is_private: false })
      if (command.options.json) writeJson(result)
      else process.stdout.write(`Made Memo #${result.data?.memo_number} public\n`)
      return 0
    }
    if (command.options.action === "delete") {
      const deleted = await deleteMemo(command.options.memoNumber)
      if (command.options.json) writeJson(deleted)
      else process.stdout.write(`Moved Memo #${deleted.data?.memo_number} to Trash\n`)
      return 0
    }
    let result = await showMemo(command.options.memoNumber)
    if (command.options.unlock && result.data?.is_locked) {
      if (result.data.access_code_hint) {
        const output = command.options.json ? process.stderr : process.stdout
        output.write(`Access code hint: ${result.data.access_code_hint}\n`)
      }
      const code = await promptSecret("Access code: ", command.options.json)
      result = await unlockMemo(command.options.memoNumber, code)
    }
    if (command.options.json) writeJson(result)
    else process.stdout.write(`${formatShow(result.data as NonNullable<typeof result.data>)}\n`)
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error."
    if (wantsJson) writeJson({ success: false, data: null, error: message })
    else process.stderr.write(`${message}\n`)
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
