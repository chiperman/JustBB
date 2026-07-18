// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { importMemos } = vi.hoisted(() => ({ importMemos: vi.fn() }))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({ user: { id: "user-1" } }),
}))

vi.mock("@/server/services/import/importService", () => ({
  importMemos,
}))

import { ImportConfigDialog } from "./ImportConfigDialog"

describe("ImportConfigDialog", () => {
  beforeEach(() => {
    importMemos.mockResolvedValue({
      total: 317,
      success: 317,
      skipped: 0,
      failed: 0,
      errors: [],
    })
  })

  it("keeps the completed-result labels on one line", async () => {
    render(<ImportConfigDialog open onOpenChange={vi.fn()} />)
    const input = document.querySelector('input[type="file"]')

    expect(input).not.toBeNull()
    fireEvent.change(input!, {
      target: {
        files: [
          {
            name: "backup.json",
            text: async () =>
              JSON.stringify([{ content: "测试记录", created_at: "2026-07-15T00:00:00.000Z" }]),
          },
        ],
      },
    })

    fireEvent.click(screen.getByRole("button", { name: "开始导入" }))

    await waitFor(() => expect(screen.getByText("导入成功！")).toBeTruthy(), { timeout: 2_000 })

    const duplicateLabel = screen.getByText("重复跳过")
    const statsGrid = duplicateLabel.parentElement?.parentElement

    expect(screen.getByRole("dialog").className).toContain("max-w-[760px]")
    expect(statsGrid?.className).toContain("grid-cols-2")
    expect(statsGrid?.className).toContain("md:grid-cols-4")
    expect(duplicateLabel.className).toContain("whitespace-nowrap")
  })

  it("shows progress from zero before a small import completes", async () => {
    render(<ImportConfigDialog open onOpenChange={vi.fn()} />)
    const input = document.querySelector('input[type="file"]')

    fireEvent.change(input!, {
      target: {
        files: [
          {
            name: "backup.json",
            text: async () =>
              JSON.stringify([{ content: "测试记录", created_at: "2026-07-15T00:00:00.000Z" }]),
          },
        ],
      },
    })
    fireEvent.click(screen.getByRole("button", { name: "开始导入" }))

    await waitFor(() => expect(screen.getByText("正在导入记录...")).toBeTruthy())
    await waitFor(() => expect(screen.getByText("导入成功！")).toBeTruthy(), { timeout: 2_000 })
  })

  it("shows the processed count while importing", async () => {
    let finishImport: (result: {
      total: number
      success: number
      skipped: number
      failed: number
      errors: never[]
    }) => void

    importMemos.mockImplementation(
      (_, onProgress) =>
        new Promise((resolve) => {
          finishImport = resolve
          onProgress({ total: 317, success: 45, skipped: 3, failed: 2, errors: [] })
        })
    )

    render(<ImportConfigDialog open onOpenChange={vi.fn()} />)
    const input = document.querySelector('input[type="file"]')

    fireEvent.change(input!, {
      target: {
        files: [
          {
            name: "backup.json",
            text: async () =>
              JSON.stringify([{ content: "测试记录", created_at: "2026-07-15T00:00:00.000Z" }]),
          },
        ],
      },
    })
    fireEvent.click(screen.getByRole("button", { name: "开始导入" }))

    await waitFor(() => expect(screen.getByText("已处理 50 / 317 条")).toBeTruthy())
    expect(screen.getByText("成功").parentElement?.textContent).toContain("45")
    expect(screen.getByText("重复跳过").parentElement?.textContent).toContain("3")
    expect(screen.getByText("失败").parentElement?.textContent).toContain("2")

    await act(async () => {
      finishImport!({ total: 317, success: 317, skipped: 0, failed: 0, errors: [] })
    })
  })
})
