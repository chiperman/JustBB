import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClient, getUser } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock("@supabase/supabase-js", () => ({ createClient }))
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  },
}))

import { getCliReadClient } from "./client"

describe("getCliReadClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("将普通账号遗留 bearer token 降级为匿名公开读取", async () => {
    const authenticatedClient = { auth: { getUser } }
    const anonymousClient = { auth: { getUser: vi.fn() } }
    createClient.mockReturnValueOnce(authenticatedClient).mockReturnValueOnce(anonymousClient)
    getUser.mockResolvedValue({
      data: { user: { app_metadata: { role: "user" } } },
      error: null,
    })

    const client = await getCliReadClient(
      new Request("http://localhost/api/cli/v1/memos", {
        headers: { Authorization: "Bearer legacy-user-token" },
      })
    )

    expect(client).toBe(anonymousClient)
    expect(createClient).toHaveBeenLastCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({ global: { headers: {} } })
    )
  })

  it("保留管理员 bearer token，以读取其私密 Memo", async () => {
    const authenticatedClient = { auth: { getUser } }
    createClient.mockReturnValueOnce(authenticatedClient)
    getUser.mockResolvedValue({
      data: { user: { app_metadata: { role: "admin" } } },
      error: null,
    })

    const client = await getCliReadClient(
      new Request("http://localhost/api/cli/v1/memos", {
        headers: { Authorization: "Bearer admin-token" },
      })
    )

    expect(client).toBe(authenticatedClient)
  })
})
