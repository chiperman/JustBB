import { renderToStaticMarkup } from "react-dom/server"
import { TrashHeader } from "../TrashHeader"
import { Delete02Icon, Archive02Icon } from "@hugeicons/core-free-icons"
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
  Button: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

// 模拟 AlertDialog 相关组件
vi.mock("@/shared/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogAction: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
