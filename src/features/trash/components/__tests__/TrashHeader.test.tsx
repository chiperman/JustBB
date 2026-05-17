import { renderToStaticMarkup } from "react-dom/server"
import { TrashHeader } from "../TrashHeader"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { expect, it, describe, vi } from "vitest"
import React from "react"

// 模拟图标
vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: ({ icon }: { icon: unknown }) => (
    <div data-testid="icon" data-icon={JSON.stringify(icon)} />
  ),
}))

// 模拟 ContextPageHeader
vi.mock("@/shared/layout/ContextPageShell", () => ({
  ContextPageHeader: ({ icon }: { icon: unknown }) => (
    <div data-testid="header-icon" data-icon={JSON.stringify(icon)} />
  ),
}))

// 模拟 Button
vi.mock("@/shared/ui/button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <div onClick={onClick}>{children}</div>,
}))

// 模拟 useConfirm
vi.mock("@/state/ConfirmContext", () => ({
  useConfirm: () => ({
    confirm: vi.fn(),
    alert: vi.fn(),
    prompt: vi.fn(),
  }),
}))

describe("TrashHeader", () => {
  it("应该使用 Delete02Icon 作为头部图标", () => {
    const html = renderToStaticMarkup(
      <TrashHeader count={0} isPending={false} onEmptyTrash={() => {}} />
    )
    // 预期应该是 Delete02Icon
    const expectedIcon = JSON.stringify(Delete02Icon).replace(/"/g, "&quot;")
    expect(html).toContain(`data-icon="${expectedIcon}"`)
  })
})
