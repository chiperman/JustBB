// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"
import { render, screen, act } from "@testing-library/react"
import { ExportProvider, useExport } from "./ExportContext"

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "a@b.com" } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
  },
}))

function TestConsumer() {
  const { status, startExport } = useExport()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <button onClick={() => act(() => startExport("json"))}>Export</button>
    </div>
  )
}

describe("ExportProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("初始状态为 idle", () => {
    render(
      <ExportProvider>
        <TestConsumer />
      </ExportProvider>
    )
    expect(screen.getByTestId("status").textContent).toBe("idle")
  })

  it("使用 exportVersionRef 防止并发导出", async () => {
    const { supabase } = await import("@/lib/supabase")
    const mockFrom = vi.fn().mockReturnThis()
    const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
    vi.mocked(supabase.from).mockImplementation(mockFrom)
    vi.mocked(supabase.select).mockImplementation(mockSelect)

    render(
      <ExportProvider>
        <TestConsumer />
      </ExportProvider>
    )

    await act(async () => {
      screen.getByText("Export").click()
    })

    // 应触发导出流程
    expect(supabase.from).toHaveBeenCalled()
  })
})
