import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { getClientMock, fetchPosterImageMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  fetchPosterImageMock: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({ getClient: getClientMock }))
vi.mock("@/server/services/share-poster-image", () => ({
  fetchPosterImage: fetchPosterImageMock,
}))

function createMemoQuery(data: unknown) {
  const single = vi.fn().mockResolvedValue({ data, error: null })
  const memoIdEq = vi.fn(() => ({ single }))
  const publicEq = vi.fn(() => ({ eq: memoIdEq }))
  const is = vi.fn(() => ({ eq: publicEq }))
  return { select: vi.fn(() => ({ is })) }
}

describe("GET /api/share-poster-image", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-1" } } }) },
      from: vi.fn(() =>
        createMemoQuery({
          content: "正文 ![图片](https://images.example.com/first.png)",
          images: [],
          is_private: false,
        })
      ),
    })
    fetchPosterImageMock.mockResolvedValue({
      body: Buffer.from("png"),
      contentType: "image/png",
    })
  })

  it("仅为当前作者的公开 Memo 临时代理首图", async () => {
    const { GET } = await import("./route")
    const response = await GET(
      new NextRequest("http://localhost/api/share-poster-image?memoId=memo-1")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("image/png")
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(fetchPosterImageMock).toHaveBeenCalledWith("https://images.example.com/first.png")
  })

  it("游客也能为公开 Memo 取得临时首图", async () => {
    getClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(() =>
        createMemoQuery({
          content: "正文 ![图片](https://images.example.com/first.png)",
          images: [],
        })
      ),
    })

    const { GET } = await import("./route")
    const response = await GET(
      new NextRequest("http://localhost/api/share-poster-image?memoId=memo-1")
    )

    expect(response.status).toBe(200)
    expect(fetchPosterImageMock).toHaveBeenCalledWith("https://images.example.com/first.png")
  })

  it("不为非公开或已删除 Memo 提供海报图片", async () => {
    getClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-1" } } }) },
      from: vi.fn(() => createMemoQuery(null)),
    })

    const { GET } = await import("./route")
    const response = await GET(
      new NextRequest("http://localhost/api/share-poster-image?memoId=memo-1")
    )

    expect(response.status).toBe(404)
    expect(fetchPosterImageMock).not.toHaveBeenCalled()
  })
})
