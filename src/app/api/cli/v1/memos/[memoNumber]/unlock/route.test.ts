import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { maybeSingle, verifyUnlockCode } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  verifyUnlockCode: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  getAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    })),
  })),
}))

vi.mock("@/server/actions/memos/mutate", () => ({ verifyUnlockCode }))

describe("POST /api/cli/v1/memos/[memoNumber]/unlock", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("用 Memo 编号解锁并返回完整 Memo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "memo-id" }, error: null })
    verifyUnlockCode.mockResolvedValueOnce({
      success: true,
      data: { memo_number: 123, content: "私密正文", images: ["https://example.com/a.jpg"] },
      error: null,
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/memos/123/unlock", {
        method: "POST",
        body: JSON.stringify({ code: "secret" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ memoNumber: "123" }) }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: { memo_number: 123, content: "私密正文", images: ["https://example.com/a.jpg"] },
      error: null,
    })
    expect(verifyUnlockCode).toHaveBeenCalledWith("memo-id", "secret")
  })

  it("没有口令时拒绝请求", async () => {
    const response = await POST(
      new Request("http://localhost/api/cli/v1/memos/123/unlock", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ memoNumber: "123" }) }
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ success: false, error: "缺少解锁口令" })
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it("触发限流时返回 429", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "memo-id" }, error: null })
    verifyUnlockCode.mockResolvedValueOnce({
      success: false,
      data: null,
      error: "尝试次数过多，请稍后再试",
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/memos/123/unlock", {
        method: "POST",
        body: JSON.stringify({ code: "secret" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ memoNumber: "123" }) }
    )

    expect(response.status).toBe(429)
  })
})
