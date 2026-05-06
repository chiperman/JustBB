import { describe, expect, it, vi } from "vitest"
import { getMemoShareUrl, getPublicAppUrl } from "./share"

// 模拟 env 模块
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: undefined,
  },
}))

describe("share helpers", () => {
  it("prefers NEXT_PUBLIC_SITE_URL for share links", async () => {
    // 动态修改 mock 值
    const { env } = await import("@/lib/env")
    env.NEXT_PUBLIC_SITE_URL = "https://memo.example.com/"

    expect(getPublicAppUrl()).toBe("https://memo.example.com")
    expect(getMemoShareUrl("memo-123")).toBe(
      "https://memo.example.com/share/memo-123"
    )
  })

  it("falls back to window origin when public app url is not configured", async () => {
    const { env } = await import("@/lib/env")
    env.NEXT_PUBLIC_SITE_URL = undefined

    vi.stubGlobal("window", {
      location: {
        origin: "https://local-preview.example.com/",
      },
    })

    expect(getPublicAppUrl()).toBe("https://local-preview.example.com")
    expect(getMemoShareUrl("memo-456")).toBe(
      "https://local-preview.example.com/share/memo-456"
    )

    vi.unstubAllGlobals()
  })

  it("returns a relative share path on the server without public app url", async () => {
    const { env } = await import("@/lib/env")
    env.NEXT_PUBLIC_SITE_URL = undefined

    expect(getPublicAppUrl()).toBe("")
    expect(getMemoShareUrl("memo-789")).toBe("/share/memo-789")
  })
})
