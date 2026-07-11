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
      "$ justmemo publish 今天的记录 #日记",
      "$ justmemo publish --private --pin 周末的秘密",
      "$ justmemo search 旅行 --tag 生活",
      "$ justmemo search --tag 生活 --limit 5",
      "$ justmemo show 42",
      "$ justmemo show 17 --unlock",
      "$ justmemo logout",
    ])

    const steps = buildDemoSteps("https://just-memo.vercel.app/cli/authorize")
    expect(steps[0].outputMode).toBe("instant")
    expect(steps[5].outputMode).toBe("instant")
    expect(steps[6].outputMode).toBe("instant")
    expect(steps[1].lines).toContain("https://just-memo.vercel.app/cli/authorize")
    expect(steps[1].lines.join("\n")).not.toContain("?request=")
    expect(steps[4].lines[0]).toBe("口令提示（可留空）：旅行记录")
    expect(steps[4].lines[1]).toBe("访问口令：********")
    expect(steps[4].lines[2]).toBe("再次输入访问口令：********")
    expect(steps[4].lines[3]).toBe("口令已确认。")
    expect(steps[8].lines[0]).toBe("口令提示：旅行记录")
    expect(steps[8].lines[1]).toBe("请输入解锁口令：********")
    expect(steps[9].lines[0]).toBe("justmemo logout success")
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

      if (screen.getByRole("region").textContent?.includes("授权码：A7K2P9")) {
        sawAuthorizationCode = true
        break
      }
    }

    expect(sawAuthorizationCode).toBe(true)

    vi.useRealTimers()
  })
})
