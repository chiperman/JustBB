import readline from "node:readline"

export async function promptSecret(label: string, writeToError = false) {
  const output = writeToError ? process.stderr : process.stdout
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    const input = readline.createInterface({ input: process.stdin, output })
    const answer = await new Promise<string>((resolve) => input.question(label, resolve))
    input.close()
    return answer
  }

  output.write(label)
  process.stdin.setRawMode(true)
  process.stdin.resume()

  return new Promise<string>((resolve, reject) => {
    let value = ""

    const cleanup = () => {
      process.stdin.setRawMode?.(false)
      process.stdin.pause()
      process.stdin.off("data", onData)
    }

    const onData = (chunk: Buffer) => {
      for (const byte of chunk) {
        if (byte === 3) {
          cleanup()
          output.write("\n")
          reject(new Error("Cancelled."))
          return
        }
        if (byte === 10 || byte === 13) {
          cleanup()
          output.write("\n")
          resolve(value)
          return
        }
        if (byte === 127 || byte === 8) {
          value = value.slice(0, -1)
          continue
        }
        value += String.fromCharCode(byte)
      }
    }

    process.stdin.on("data", onData)
  })
}

export async function promptText(label: string, writeToError = false) {
  const input = readline.createInterface({
    input: process.stdin,
    output: writeToError ? process.stderr : process.stdout,
  })
  const answer = await new Promise<string>((resolve) => input.question(label, resolve))
  input.close()
  return answer
}

export async function promptEnter(label: string) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false

  const input = readline.createInterface({ input: process.stdin, output: process.stdout })
  await new Promise<void>((resolve) => input.question(label, () => resolve()))
  input.close()
  return true
}

export async function confirmDangerousAction(label: string, writeToError = false) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Use --yes to confirm this destructive action in a non-interactive session.")
  }
  return (await promptText(`${label} [y/N] `, writeToError)).trim().toLowerCase() === "y"
}
