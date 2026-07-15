import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }))

vi.mock("@/server/services/cli/client", () => ({
  getCliClient: vi.fn(() => ({ auth: { getUser } })),
}))

describe("GET /api/cli/v1/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("拒绝历史普通账号 CLI 会话", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-id", app_metadata: { role: "user" } } },
      error: null,
    })

    const response = await GET(new Request("http://localhost/api/cli/v1/auth/me"))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "CLI access is restricted to administrators.",
    })
  })
})
