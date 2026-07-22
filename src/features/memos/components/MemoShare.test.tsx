// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoShare } from "./MemoShare"

vi.mock("@/shared/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-share-poster-dialog>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))
vi.mock("@/shared/hooks/useHasMounted", () => ({ useHasMounted: () => true }))
vi.mock("@/shared/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }))
vi.mock("html-to-image", () => ({ toBlob: vi.fn() }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }))

const memo = {
  id: "memo-1",
  content: "https://bestdesignsonx.com/sorenblank/status/2024745061423214826",
  created_at: "2026-07-22T00:00:00.000Z",
  images: [],
} as never

describe("MemoShare", () => {
  beforeEach(() => vi.clearAllMocks())

  it("默认极简禅意，并保留主题与显示开关", () => {
    render(<MemoShare memo={memo} open onOpenChange={vi.fn()} hideTrigger />)

    expect(screen.getByRole("button", { name: "极简禅意" }).getAttribute("aria-pressed")).toBe(
      "true"
    )
    expect(screen.getByRole("switch", { name: "显示品牌" }).getAttribute("aria-checked")).toBe(
      "true"
    )

    fireEvent.click(screen.getByRole("button", { name: "暗夜时光" }))
    fireEvent.click(screen.getByRole("switch", { name: "显示二维码" }))

    expect(screen.getByRole("button", { name: "暗夜时光" }).getAttribute("aria-pressed")).toBe(
      "true"
    )
    expect(screen.getByRole("switch", { name: "显示二维码" }).getAttribute("aria-checked")).toBe(
      "false"
    )
  })

  it("使用公共 Dialog，并把正文链接收敛为不可点击域名", () => {
    const { container } = render(<MemoShare memo={memo} open onOpenChange={vi.fn()} hideTrigger />)

    expect(container.querySelector("[data-share-poster-dialog]")).not.toBeNull()

    const posterLink = screen.getByText("bestdesignsonx.com")
    expect(posterLink.closest("a")).toBeNull()
  })
})
