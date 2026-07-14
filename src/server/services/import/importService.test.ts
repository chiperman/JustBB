import { beforeEach, describe, expect, it, vi } from "vitest"

const { authGetUser, from } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  from: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: authGetUser },
    from,
  },
}))

import { importMemos } from "./importService"

describe("importMemos", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("imports 317 records within the performance budget", async () => {
    const response = { data: [], error: null }
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      range: vi.fn(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      insert: vi.fn(),
    }

    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.range.mockReturnValue(query)
    query.in.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return response
    })
    query.maybeSingle.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return response
    })
    query.single.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return response
    })
    query.insert.mockResolvedValue({ error: null })
    Object.assign(query, {
      then: (resolve: (value: typeof response) => unknown) =>
        new Promise((done) => setTimeout(done, 10)).then(() => resolve(response)),
    })
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    from.mockReturnValue(query)

    const memos = Array.from({ length: 317 }, (_, index) => ({
      id: `memo-${index}`,
      content: `记录 ${index}`,
      created_at: new Date(2026, 0, 1, 0, index).toISOString(),
    }))
    const startedAt = performance.now()

    const onProgress = vi.fn()
    const result = await importMemos(memos, onProgress)

    expect(result).toMatchObject({ total: 317, success: 317, skipped: 0, failed: 0 })
    expect(performance.now() - startedAt).toBeLessThan(1_000)
    expect(query.in).toHaveBeenCalledTimes(7)
    expect(query.maybeSingle).not.toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalledTimes(7)
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ total: 317, success: 317, skipped: 0, failed: 0 })
    )
  })

  it("keeps ID and content-time duplicate detection", async () => {
    const idLookup = {
      select: vi.fn(),
      in: vi.fn(),
    }
    const contentLookup = {
      select: vi.fn(),
      eq: vi.fn(),
      range: vi.fn(),
    }
    const insert = vi.fn().mockResolvedValue({ error: null })

    idLookup.select.mockReturnValue(idLookup)
    idLookup.in.mockResolvedValue({ data: [{ id: "existing-id" }], error: null })
    contentLookup.select.mockReturnValue(contentLookup)
    contentLookup.eq.mockReturnValue(contentLookup)
    contentLookup.range.mockResolvedValue({
      data: [{ content: "已有正文", created_at: "2026-01-02T00:00:00.000Z" }],
      error: null,
    })
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    from
      .mockReturnValueOnce(idLookup)
      .mockReturnValueOnce(contentLookup)
      .mockReturnValueOnce({ insert })

    const result = await importMemos([
      { id: "existing-id", content: "新的正文", created_at: "2026-01-03T00:00:00.000Z" },
      { content: "已有正文", created_at: "2026-01-02T00:00:00.000Z" },
      { content: "新记录", created_at: "2026-01-04T00:00:00.000Z" },
    ])

    expect(result).toMatchObject({ total: 3, success: 1, skipped: 2, failed: 0 })
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ content: "新记录", owner_id: "user-1" }),
    ])
  })

  it("does not index ID-conflict skips as content-time duplicates across batches", async () => {
    const idLookup = {
      select: vi.fn(),
      in: vi.fn(),
    }
    const contentLookup = {
      select: vi.fn(),
      eq: vi.fn(),
      range: vi.fn(),
    }
    const insert = vi.fn().mockResolvedValue({ error: null })

    idLookup.select.mockReturnValue(idLookup)
    idLookup.in.mockResolvedValue({ data: [{ id: "existing-id" }], error: null })
    contentLookup.select.mockReturnValue(contentLookup)
    contentLookup.eq.mockReturnValue(contentLookup)
    contentLookup.range.mockResolvedValue({ data: [], error: null })
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    from
      .mockReturnValueOnce(idLookup)
      .mockReturnValueOnce(idLookup)
      .mockReturnValueOnce(contentLookup)
      .mockReturnValue({ insert })

    const createdAt = "2026-01-01T00:00:00.000Z"
    const firstBatch = Array.from({ length: 50 }, (_, index) => ({
      id: index === 0 ? "existing-id" : `first-${index}`,
      content: index === 0 ? "共享正文" : `第一批 ${index}`,
      created_at: createdAt,
    }))
    const result = await importMemos([
      ...firstBatch,
      { id: "new-id", content: "共享正文", created_at: createdAt },
    ])

    expect(result).toMatchObject({ total: 51, success: 50, skipped: 1, failed: 0 })
    expect(insert).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: "new-id", content: "共享正文", owner_id: "user-1" }),
    ])
  })

  it("loads every existing-memo page before content-time duplicate detection", async () => {
    const contentLookup = {
      select: vi.fn(),
      eq: vi.fn(),
      range: vi.fn(),
    }

    contentLookup.select.mockReturnValue(contentLookup)
    contentLookup.eq.mockReturnValue(contentLookup)
    contentLookup.range
      .mockResolvedValueOnce({
        data: Array.from({ length: 1_000 }, (_, index) => ({
          content: `已有记录 ${index}`,
          created_at: "2026-01-01T00:00:00.000Z",
        })),
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ content: "第二页记录", created_at: "2026-01-02T00:00:00.000Z" }],
        error: null,
      })
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    from.mockReturnValue(contentLookup)

    const result = await importMemos([
      { content: "第二页记录", created_at: "2026-01-02T00:00:00.000Z" },
    ])

    expect(result).toMatchObject({ total: 1, success: 0, skipped: 1, failed: 0 })
    expect(contentLookup.range).toHaveBeenCalledTimes(2)
  })
})
