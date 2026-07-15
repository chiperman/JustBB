import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { refreshSession, getUser } = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock("@/server/services/cli/client", () => ({
  getCliAuthClient: vi.fn(() => ({ auth: { refreshSession, getUser } })),
}))

describe("POST /api/cli/v1/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("拒绝普通账号刷新 CLI 会话，也不返回新 token", async () => {
    refreshSession.mockResolvedValue({
      data: {
        session: { access_token: "new-access", refresh_token: "new-refresh", expires_at: 123 },
      },
      error: null,
    })
    getUser.mockResolvedValue({
      data: { user: { app_metadata: { role: "user" } } },
      error: null,
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: "old-refresh" }),
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "CLI access is restricted to administrators.",
      data: null,
    })
  })
})
