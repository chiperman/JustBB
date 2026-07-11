import { beforeEach, describe, expect, it, vi } from "vitest"
import TrashPage from "./page"

const { isAdmin, redirect } = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`REDIRECT:${destination}`)
  }),
}))

vi.mock("@/features/auth/actions", () => ({
  isAdmin,
}))

vi.mock("next/navigation", () => ({
  redirect,
}))

vi.mock("@/features/trash", () => ({
  TrashClient: () => null,
}))

describe("TrashPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("普通账号访问时应跳转到无权限页面", async () => {
    isAdmin.mockResolvedValue(false)

    await expect(TrashPage()).rejects.toThrow("REDIRECT:/unauthorized")
    expect(redirect).toHaveBeenCalledWith("/unauthorized")
  })

  it("操作者访问时应正常渲染", async () => {
    isAdmin.mockResolvedValue(true)

    await expect(TrashPage()).resolves.toBeDefined()
    expect(redirect).not.toHaveBeenCalled()
  })
})
