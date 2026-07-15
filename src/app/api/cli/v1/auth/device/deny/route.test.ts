import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { getUser, getAdminClient, update } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getAdminClient: vi.fn(),
  update: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  getClient: vi.fn(async () => ({ auth: { getUser } })),
  getAdminClient,
}))

describe("POST /api/cli/v1/auth/device/deny", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        update: (...args: unknown[]) => {
          update(...args)
          return { eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) }
        },
      })),
    })
  })

  it("普通账号登录网页后自动拒绝该 CLI 授权请求", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-id", app_metadata: { role: "user" } } },
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/auth/device/deny", {
        method: "POST",
        body: JSON.stringify({ request_id: "request-id" }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { status: "denied" },
      error: null,
    })
    expect(update).toHaveBeenCalledWith({ status: "denied" })
  })
})
