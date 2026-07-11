import { beforeEach, describe, expect, it, vi } from "vitest"

const { readSession, writeSession } = vi.hoisted(() => ({
  readSession: vi.fn(),
  writeSession: vi.fn(),
}))

vi.mock("./auth-store.js", () => ({ readSession, writeSession }))

import { publishMemo, searchMemos } from "./client.js"

const oldSession = { access_token: "expired-token", refresh_token: "old-refresh-token" }
const refreshedSession = { access_token: "fresh-token", refresh_token: "fresh-refresh-token" }

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("CLI API client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it("在发布时自动刷新过期会话并重试", async () => {
    readSession
      .mockResolvedValueOnce(oldSession)
      .mockResolvedValueOnce(oldSession)
      .mockResolvedValueOnce(refreshedSession)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({ success: false, data: null, error: "请先执行 justmemo login" }, 401)
      )
      .mockResolvedValueOnce(response({ success: true, data: refreshedSession, error: null }))
      .mockResolvedValueOnce(response({ success: true, data: { memo_number: 43 }, error: null }))
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      publishMemo({ content: "测试", images: [], is_private: false, is_pinned: false })
    ).resolves.toMatchObject({ data: { memo_number: 43 } })

    expect(writeSession).toHaveBeenCalledWith(refreshedSession)
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization")).toBe(
      "Bearer fresh-token"
    )
  })

  it("将页码发送给搜索接口", async () => {
    readSession.mockResolvedValue(null)
    const fetchMock = vi.fn().mockResolvedValue(response({ success: true, data: [], error: null }))
    vi.stubGlobal("fetch", fetchMock)

    await searchMemos({ query: "", limit: 20, page: 2, json: false })

    expect(fetchMock.mock.calls[0][0]).toContain("limit=20&page=2")
  })

  it("搜索前刷新已过期的本地会话", async () => {
    const expiredSession = {
      access_token: `header.${Buffer.from(JSON.stringify({ exp: 1 })).toString("base64url")}.signature`,
      refresh_token: "old-refresh-token",
    }
    readSession
      .mockResolvedValueOnce(expiredSession)
      .mockResolvedValueOnce(expiredSession)
      .mockResolvedValueOnce(refreshedSession)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: true, data: refreshedSession, error: null }))
      .mockResolvedValueOnce(response({ success: true, data: [], error: null }))
    vi.stubGlobal("fetch", fetchMock)

    await searchMemos({ query: "", limit: 20, page: 1, json: false })

    expect(fetchMock.mock.calls[0][0]).toContain("/api/cli/v1/auth/refresh")
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization")).toBe(
      "Bearer fresh-token"
    )
  })
})
