import { describe, expect, it, vi } from "vitest"
import { GET } from "./route"

const rpc = vi.fn()

vi.mock("@/server/services/cli/client", () => ({
  getCliClient: vi.fn(() => ({ rpc })),
}))

describe("GET /api/cli/v1/memos", () => {
  it("默认查询最近 20 条 Memo", async () => {
    rpc.mockResolvedValueOnce({ data: [{ memo_number: 123 }], error: null })

    const response = await GET(new Request("http://localhost/api/cli/v1/memos"))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: [{ memo_number: 123 }],
      error: null,
    })
    expect(rpc).toHaveBeenCalledWith("search_memos_secure", {
      query_text: "",
      unlocked_ids: [],
      limit_val: 20,
      offset_val: 0,
      filters: {},
      sort_order: "newest",
    })
  })

  it("把正文、Tag、编号和数量过滤转换为安全查询参数", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null })

    await GET(
      new Request(
        "http://localhost/api/cli/v1/memos?q=旅行%20上海&tag=工作&num=123&limit=50&page=3"
      )
    )

    expect(rpc).toHaveBeenCalledWith("search_memos_secure", {
      query_text: "旅行 上海",
      unlocked_ids: [],
      limit_val: 50,
      offset_val: 100,
      filters: { tag: "工作", num: "123" },
      sort_order: "newest",
    })
  })
})
