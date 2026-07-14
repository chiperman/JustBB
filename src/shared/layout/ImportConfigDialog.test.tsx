// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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

    await waitFor(() => expect(screen.getByText("导入成功！")).toBeTruthy())

    const duplicateLabel = screen.getByText("重复跳过")
    const statsGrid = duplicateLabel.parentElement?.parentElement

    expect(screen.getByRole("dialog").className).toContain("max-w-[720px]")
    expect(statsGrid?.className).toContain("grid-cols-2")
    expect(statsGrid?.className).toContain("md:grid-cols-4")
    expect(duplicateLabel.className).toContain("whitespace-nowrap")
  })
})
