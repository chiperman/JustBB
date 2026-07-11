// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildDemoSteps, TerminalUsageDemo } from "./demo"

describe("TerminalUsageDemo", () => {
  it("覆盖 CLI 的完整命令与关键参数分支", () => {
    expect(
      buildDemoSteps("https://just-memo.vercel.app/cli/authorize").map((step) => step.command)
    ).toEqual([
      "$ justmemo help",
      "$ justmemo login",
      "$ justmemo whoami",
      "$ justmemo publish Today's note #journal",
      "$ justmemo publish --private --pin A quiet weekend",
      "$ justmemo search Shanghai --tag travel",
      "$ justmemo show 42",
      "$ justmemo edit 42",
      "$ justmemo show 42 --pin",
      "$ justmemo show 42 --delete",
      "$ justmemo trash 42 --restore",
      "$ justmemo show 17 --unlock",
      "$ justmemo logout",
    ])

    const steps = buildDemoSteps(
      "https://just-memo.vercel.app/cli/authorize?request=5e6f1e1f-d8c0-4521-a85a-31e7f842d218"
    )
    expect(steps[0].lines).toHaveLength(7)
    expect(steps[0].lines.at(-1)).toBe("  …")
    expect(steps[0].outputMode).toBe("instant")
    expect(steps[5].outputMode).toBe("instant")
    expect(steps[1].lines.join("\n")).toContain("request=***")
    expect(steps[1].lines.join("\n")).not.toContain("5e6f1e1f")
    expect(steps[1].lines).toContain("Press ENTER to open in your browser...")
    expect(steps[1].lines).toContain("Waiting for browser authorization...")
    expect(steps[2].lines).toEqual(["cli-manual@example.com (admin)"])
    expect(steps[4].lines[0]).toBe("Access code: ********")
    expect(steps[4].lines[1]).toBe("Confirm access code: ********")
    expect(steps[4].lines[2]).toBe("Access code hint (optional): travel notes")
    expect(steps[8].lines).toEqual(["Pinned Memo #42"])
    expect(steps[9].lines).toEqual(["Moved Memo #42 to Trash"])
    expect(steps[10].lines).toEqual(["Restored Memo #42"])
    expect(steps[11].lines[0]).toBe("Access code hint: travel notes")
    expect(steps[11].lines[1]).toBe("Access code: ********")
    expect(steps[12].lines[0]).toBe("justmemo logout success")
  })

  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  it("为长输出保留固定的终端内容视口", () => {
    render(<TerminalUsageDemo requestId="demo-request" />)

    const body = screen.getByRole("region").querySelector("[data-terminal-body]")

    expect(body).not.toBeNull()
    expect(body?.className ?? "").toContain("h-[250px]")
    expect(body?.className ?? "").toContain("overflow-hidden")
  })

  it("会继续渲染 CLI 输出中的空行之后的内容", async () => {
    vi.useFakeTimers()

    render(<TerminalUsageDemo />)

    let sawAuthorizationCode = false
    for (let index = 0; index < 160; index += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })

      if (screen.getByRole("region").textContent?.includes("Authorization code: A7K2P9")) {
        sawAuthorizationCode = true
        break
      }
    }

    expect(sawAuthorizationCode).toBe(true)

    vi.useRealTimers()
  })
})
