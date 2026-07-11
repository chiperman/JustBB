import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { getUser, insert, single } = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
  single: vi.fn(),
}))

vi.mock("@/server/services/cli/client", () => ({
  getCliClient: vi.fn(() => ({
    auth: { getUser },
    from: vi.fn(() => ({
      insert: (...args: unknown[]) => {
        insert(...args)
        return { select: vi.fn(() => ({ single })) }
      },
    })),
  })),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("POST /api/cli/v1/memos/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未登录时拒绝发布", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "unauthorized" } })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/memos/publish", {
        method: "POST",
        body: JSON.stringify({ content: "hello" }),
      })
    )

    expect(response.status).toBe(401)
    expect(insert).not.toHaveBeenCalled()
  })

  it("普通用户不能发布", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id", app_metadata: { role: "user" } } },
      error: null,
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/memos/publish", {
        method: "POST",
        body: JSON.stringify({ content: "hello" }),
      })
    )

    expect(response.status).toBe(403)
    expect(insert).not.toHaveBeenCalled()
  })

  it("管理员可以发布正文、标签和图片链接", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: "admin-id", app_metadata: { role: "admin" } } },
      error: null,
    })
    single.mockResolvedValueOnce({
      data: { memo_number: 123, content: "hello #工作", images: ["https://example.com/a.jpg"] },
      error: null,
    })

    const response = await POST(
      new Request("http://localhost/api/cli/v1/memos/publish", {
        method: "POST",
        body: JSON.stringify({
          content: "hello #工作",
          images: ["https://example.com/a.jpg"],
          is_private: false,
          is_pinned: false,
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: "admin-id",
        content: "hello #工作",
        tags: ["工作"],
        images: ["https://example.com/a.jpg"],
      })
    )
  })
})
