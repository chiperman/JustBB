import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET, PATCH } from "./route"

const { rpc, getUser, from, maybeSingle, single } = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
}))

vi.mock("@/server/services/cli/client", () => ({
  getCliClient: vi.fn(() => ({ rpc, auth: { getUser }, from })),
  getCliReadClient: vi.fn(async () => ({ rpc })),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("GET /api/cli/v1/memos/:memoNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("按展示编号返回完整或锁定状态的 Memo", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ memo_number: 123, is_locked: true, access_code_hint: "我的生日" }],
      error: null,
    })

    const response = await GET(new Request("http://localhost/api/cli/v1/memos/123"), {
      params: Promise.resolve({ memoNumber: "123" }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: { memo_number: 123, is_locked: true, access_code_hint: "我的生日" },
      error: null,
    })
    expect(rpc).toHaveBeenCalledWith("search_memos_secure", {
      query_text: "",
      unlocked_ids: [],
      limit_val: 1,
      offset_val: 0,
      filters: { num: "123" },
      sort_order: "newest",
    })
  })

  it("编号无效时返回参数错误", async () => {
    const response = await GET(new Request("http://localhost/api/cli/v1/memos/nope"), {
      params: Promise.resolve({ memoNumber: "nope" }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      success: false,
      data: null,
      error: "无效的 Memo 编号",
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it("管理员可以按展示编号更新置顶状态", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: "admin-id", app_metadata: { role: "admin" } } },
      error: null,
    })
    from
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({ maybeSingle })),
            })),
          })),
        })),
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({ single })),
            })),
          })),
        })),
      })
    maybeSingle.mockResolvedValueOnce({
      data: { id: "memo-id", images: [], image_metadata: {} },
      error: null,
    })
    single.mockResolvedValueOnce({ data: { memo_number: 123, is_pinned: true }, error: null })

    const response = await PATCH(
      new Request("http://localhost/api/cli/v1/memos/123", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_pinned: true }),
      }),
      { params: Promise.resolve({ memoNumber: "123" }) }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      success: true,
      data: { memo_number: 123, is_pinned: true },
    })
  })
})
