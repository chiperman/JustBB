import readline from "node:readline"

export async function promptSecret(label: string) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    const input = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise<string>((resolve) => input.question(label, resolve))
    input.close()
    return answer
  }

  process.stdout.write(label)
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
          process.stdout.write("\n")
          reject(new Error("已取消"))
          return
        }
        if (byte === 10 || byte === 13) {
          cleanup()
          process.stdout.write("\n")
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

export async function promptText(label: string) {
  const input = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>((resolve) => input.question(label, resolve))
  input.close()
  return answer
}
