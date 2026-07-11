import { chmod, mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import type { CliSession } from "./types.js"

function sessionPath() {
  return process.env.JUSTMEMO_SESSION_FILE || join(homedir(), ".config", "justmemo", "session.json")
}

export async function readSession(): Promise<CliSession | null> {
  try {
    const value = JSON.parse(await readFile(sessionPath(), "utf8")) as CliSession
    if (!value.access_token || !value.refresh_token) return null
    return value
  } catch {
    return null
  }
}

export async function writeSession(session: CliSession) {
  const file = sessionPath()
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  await writeFile(file, `${JSON.stringify(session)}\n`, { mode: 0o600 })
  await chmod(file, 0o600)
}

export async function clearSession() {
  try {
    await unlink(sessionPath())
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
}
