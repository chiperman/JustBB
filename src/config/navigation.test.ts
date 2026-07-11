import { describe, expect, it } from "vitest"
import { NAVIGATION_CONFIG } from "./navigation"

describe("navigation permissions", () => {
  it("回收站只允许操作者访问", () => {
    const trash = NAVIGATION_CONFIG.find((item) => item.id === "trash")

    expect(trash).toMatchObject({
      requiresAuth: true,
      isAdminOnly: true,
    })
  })
})
