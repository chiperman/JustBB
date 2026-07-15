import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { getUser, getSession, getAdminClient, encryptDeviceToken, maybeSingle, update } = vi.hoisted(
  () => ({
    getUser: vi.fn(),
    getSession: vi.fn(),
    getAdminClient: vi.fn(),
    encryptDeviceToken: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
  })
)

vi.mock("@/lib/supabase", () => ({
  getClient: vi.fn(async () => ({ auth: { getUser, getSession } })),
  getAdminClient,
}))

vi.mock("@/server/services/cli/device", () => ({
  encryptDeviceToken,
  hashDeviceCode: vi.fn(() => "hashed-code"),
}))

describe("POST /api/cli/v1/auth/device/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
        })),
        update: (...args: unknown[]) => {
          update(...args)
          return { eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) }
        },
      })),
    })
  })

  it("拒绝普通账号，并标记授权请求为 denied 而不加密 token", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-id", app_metadata: { role: "user" } } },
    })
    getSession.mockResolvedValue({
      data: { session: { access_token: "access", refresh_token: "refresh" } },
    })
    maybeSingle.mockResolvedValue({
      data: {
        id: "request-id",
        status: "pending",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/auth/device/approve", {
        method: "POST",
        body: JSON.stringify({ request_id: "request-id", code: "ABC234" }),
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "CLI access is restricted to administrators.",
    })
    expect(update).toHaveBeenCalledWith({ status: "denied" })
    expect(encryptDeviceToken).not.toHaveBeenCalled()
  })
})
