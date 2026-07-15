import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { getAdminClient, maybeSingle } = vi.hoisted(() => ({
  getAdminClient: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({ getAdminClient }))
vi.mock("@/server/services/cli/device", () => ({
  decryptDeviceToken: vi.fn(),
  hashDeviceCode: vi.fn(() => "hashed-code"),
}))

describe("POST /api/cli/v1/auth/device/poll", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
        })),
      })),
    })
  })

  it("普通账号被拒绝后，终端轮询立即收到管理员限定错误", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: "request-id",
        status: "denied",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        access_token: null,
        refresh_token: null,
      },
      error: null,
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/auth/device/poll", {
        method: "POST",
        body: JSON.stringify({ request_id: "request-id", code: "ABC234" }),
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "CLI access is restricted to administrators.",
    })
  })
})
