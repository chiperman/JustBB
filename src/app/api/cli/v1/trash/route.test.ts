import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

const { getUser, from, order } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  order: vi.fn(),
}))

vi.mock("@/server/services/cli/client", () => ({
  getCliClient: vi.fn(() => ({ auth: { getUser }, from })),
}))

describe("GET /api/cli/v1/trash", () => {
  beforeEach(() => vi.clearAllMocks())

  it("管理员可以按分页查看自己的回收站", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: "admin-id", app_metadata: { role: "admin" } } },
      error: null,
    })
    from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn(() => ({ order })),
        })),
      })),
    })
    order.mockReturnValueOnce({
      range: vi.fn().mockResolvedValueOnce({ data: [{ memo_number: 123 }], error: null }),
    })

    const response = await GET(new Request("http://localhost/api/cli/v1/trash?limit=10&page=2"))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: [{ memo_number: 123 }],
      error: null,
    })
    expect(order).toHaveBeenCalledWith("deleted_at", { ascending: false })
  })
})
