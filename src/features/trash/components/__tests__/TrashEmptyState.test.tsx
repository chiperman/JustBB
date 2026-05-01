import { renderToStaticMarkup } from "react-dom/server"
import { TrashEmptyState } from "../TrashEmptyState"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { expect, it, describe, vi } from "vitest"
import React from "react"

// 模拟图标
vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: ({ icon }: { icon: unknown }) => (
    <div data-testid="icon" data-icon={JSON.stringify(icon)} />
  ),
}))

// 模拟 framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children: React.ReactNode
      className: string
    }) => <div className={className}>{children}</div>,
  },
}))

describe("TrashEmptyState", () => {
  it("应该使用 Delete02Icon 作为空状态图标", () => {
    const html = renderToStaticMarkup(<TrashEmptyState />)
    const expectedIcon = JSON.stringify(Delete02Icon).replace(/"/g, "&quot;")
    expect(html).toContain(`data-icon="${expectedIcon}"`)
  })
})
