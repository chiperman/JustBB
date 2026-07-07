import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const sileoMocks = vi.hoisted(() => ({
  clear: vi.fn(),
  dismiss: vi.fn(),
  error: vi.fn(() => "error-toast"),
  success: vi.fn(() => "success-toast"),
}))

vi.mock("sileo", () => ({
  sileo: sileoMocks,
}))

import { toast } from "./use-toast"

describe("toast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: false })),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("为成功 toast 传递绿色主题样式", () => {
    toast({ title: "已保存", description: "内容已更新", variant: "success" })

    expect(sileoMocks.success).toHaveBeenCalledWith({
      title: "已保存",
      description: "内容已更新",
      duration: undefined,
      fill: "var(--toast-success-bg)",
      styles: {
        badge: "bg-(--toast-success-text)/15! text-(--toast-success-text)!",
        title: "text-(--toast-success-text)!",
        description: "text-(--toast-success-text)/80!",
      },
    })
  })

  it("为破坏性 toast 传递错误主题样式", () => {
    toast({ title: "保存失败", description: "请稍后再试", variant: "destructive" })

    expect(sileoMocks.error).toHaveBeenCalledWith({
      title: "保存失败",
      description: "请稍后再试",
      duration: undefined,
      fill: "var(--toast-destructive-bg)",
      styles: {
        badge: "bg-(--toast-destructive-text)/15! text-(--toast-destructive-text)!",
        title: "text-(--toast-destructive-text)!",
        description: "text-(--toast-destructive-text)/80!",
      },
    })
  })

  it("移动端带描述的 toast 默认展开", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    })

    toast({ title: "口令错误", description: "请检查访问口令后重试", variant: "destructive" })

    expect(sileoMocks.error).toHaveBeenCalledWith(
      expect.objectContaining({
        autopilot: { expand: 0, collapse: 0 },
      })
    )
  })
})
