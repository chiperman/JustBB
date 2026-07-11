import { spawn } from "node:child_process"

export function openBrowser(url: string) {
  const command =
    process.platform === "darwin"
      ? { file: "open", args: [url] }
      : process.platform === "win32"
        ? { file: "cmd.exe", args: ["/c", "start", "", url] }
        : { file: "xdg-open", args: [url] }

  try {
    const child = spawn(command.file, command.args, {
      detached: true,
      stdio: "ignore",
    })
    child.once("error", () => undefined)
    child.unref()
    return true
  } catch {
    return false
  }
}
