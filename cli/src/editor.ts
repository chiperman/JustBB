import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

function editorCommand() {
  if (process.env.VISUAL) return process.env.VISUAL
  if (process.env.EDITOR) return process.env.EDITOR
  if (process.platform === "win32") return "notepad"
  return "vi"
}

export async function editText(initialValue: string) {
  const directory = await mkdtemp(join(tmpdir(), "justmemo-"))
  const file = join(directory, "memo.txt")
  await writeFile(file, initialValue, "utf8")

  try {
    const [command, ...args] = editorCommand().trim().split(/\s+/)
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, [...args, file], { stdio: "inherit" })
      child.once("error", reject)
      child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error("编辑器退出失败"))))
    })
    return readFile(file, "utf8")
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
