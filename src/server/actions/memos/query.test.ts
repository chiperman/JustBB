/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getMemos,
  getGalleryMemos,
  getArchivedMemos,
  getOnThisDayMemos,
  getBacklinks,
} from "./query"
import { getClient } from "@/lib/supabase"
import { getCurrentUserId } from "@/features/auth/actions"

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  getClient: vi.fn(),
  getAdminClient: vi.fn(),
}))

// Mock auth actions
vi.mock("@/features/auth/actions", () => ({
  getCurrentUserId: vi.fn(),
}))

describe("getMemos TDD", () => {
  const mockRpc = vi.fn()
  const mockSupabase = {
    rpc: mockRpc,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getCurrentUserId).mockResolvedValue(null)
  })

  it("should call search_memos_secure with default parameters", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const result = await getMemos({})
    expect(result.success).toBe(true)
    expect(result.data).toEqual([])

    expect(mockRpc).toHaveBeenCalledWith("search_memos_secure", {
      query_text: "",
      unlocked_ids: [],
      limit_val: 20,
      offset_val: 0,
      filters: {},
      sort_order: "newest",
    })
  })

  it("should pass tag filter to RPC", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const result = await getMemos({ tag: "TestTag" })
    expect(result.success).toBe(true)

    expect(mockRpc).toHaveBeenCalledWith(
      "search_memos_secure",
      expect.objectContaining({
        filters: { tag: "TestTag" },
      })
    )
  })

  it("should pass date filter to RPC", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const result = await getMemos({ date: "2026-02-06" })
    expect(result.success).toBe(true)

    expect(mockRpc).toHaveBeenCalledWith(
      "search_memos_secure",
      expect.objectContaining({
        filters: { date: "2026-02-06" },
      })
    )
  })

  it("should pass date filter even when before_date is present (for pagination)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const result = await getMemos({ date: "2026-02-06", before_date: "2026-02-06T12:00:00Z" })
    expect(result.success).toBe(true)

    expect(mockRpc).toHaveBeenCalledWith(
      "search_memos_secure",
      expect.objectContaining({
        filters: { date: "2026-02-06", before_date: "2026-02-06T12:00:00Z" },
      })
    )
  })

  it("should handle pagination offset and limit", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const result = await getMemos({ limit: 10, offset: 20 })
    expect(result.success).toBe(true)

    expect(mockRpc).toHaveBeenCalledWith(
      "search_memos_secure",
      expect.objectContaining({
        limit_val: 10,
        offset_val: 20,
      })
    )
  })

  it("should handle errors by returning empty array", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    })

    const result = await getMemos({})

    expect(result.success).toBe(false)
    expect(result.data).toEqual([])
    expect(result.error).toBe("查询失败")
  })
})

describe("Derivative Memo Queries TDD", () => {
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockSupabase = {
    from: mockFrom,
    rpc: mockRpc,
  }

  // 辅助函数：构造链式调用的 mock
  const makeMockQuery = (data: any = [], error: any = null) => {
    const query: any = {
      is: vi.fn().mockImplementation(() => query),
      eq: vi.fn().mockImplementation(() => query),
      contains: vi.fn().mockImplementation(() => query),
      ilike: vi.fn().mockImplementation(() => query),
      order: vi.fn().mockImplementation(() => query),
      range: vi.fn().mockImplementation(() => query),
      not: vi.fn().mockImplementation(() => query),
      gte: vi.fn().mockImplementation(() => query),
      lte: vi.fn().mockImplementation(() => query),
      then: vi.fn().mockImplementation((onfulfilled: any) => {
        return Promise.resolve(onfulfilled({ data, error }))
      }),
    }
    return query
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getClient).mockResolvedValue(mockSupabase as any)
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  describe("getGalleryMemos", () => {
    it("should fetch active gallery memos and handle ownership / lock correctly", async () => {
      const mockMemos = [
        {
          id: "1",
          owner_id: "user-1",
          is_private: false,
          content: "Public with image ![img](url)",
        },
        {
          id: "2",
          owner_id: "user-1",
          is_private: true,
          content: "Private with image ![img](url)",
        },
        {
          id: "3",
          owner_id: "user-2",
          is_private: true,
          content: "B's Private with image ![img](url)",
        },
      ]

      mockRpc.mockResolvedValue({ data: mockMemos, error: null })
      vi.mocked(getCurrentUserId).mockResolvedValue("user-1")

      const result = await getGalleryMemos(20, 0)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)

      expect(mockRpc).toHaveBeenCalledWith("search_memos_secure", {
        query_text: "",
        unlocked_ids: [],
        limit_val: 20,
        offset_val: 0,
        filters: { has_image: "true" },
        sort_order: "newest",
      })

      // 验证 is_owner 和 is_locked 动态计算结果
      const memo1 = result.data.find((m) => m.id === "1")
      const memo2 = result.data.find((m) => m.id === "2")
      const memo3 = result.data.find((m) => m.id === "3")

      expect(memo1?.is_owner).toBe(true)
      expect(memo1?.is_locked).toBe(false) // 公开的，不锁定

      expect(memo2?.is_owner).toBe(true)
      expect(memo2?.is_locked).toBe(false) // 私密但所有者是自己，不锁定

      expect(memo3?.is_owner).toBe(false)
      expect(memo3?.is_locked).toBe(true) // 私密且所有者是别人，锁定
      expect(memo3?.content).toContain("locked-placeholder.png")
    })
  })

  describe("getArchivedMemos", () => {
    it("should query date range and structure is_locked for owner", async () => {
      const mockMemos = [
        { id: "1", owner_id: "user-1", is_private: false },
        { id: "2", owner_id: "user-2", is_private: true },
      ]

      const mockQuery = makeMockQuery(mockMemos)
      mockSelect.mockReturnValue(mockQuery)
      vi.mocked(getCurrentUserId).mockResolvedValue("user-1")

      const result = await getArchivedMemos(2026, 6)
      expect(result.success).toBe(true)
      expect(mockQuery.gte).toHaveBeenCalled()
      expect(mockQuery.lte).toHaveBeenCalled()

      const memo1 = result.data.find((m) => m.id === "1")
      const memo2 = result.data.find((m) => m.id === "2")

      expect(memo1?.is_locked).toBe(false)
      expect(memo2?.is_locked).toBe(true)
    })
  })

  describe("getOnThisDayMemos", () => {
    it("should filter lookback years and dynamically lock", async () => {
      const today = new Date()
      const sameDayLastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      const differentDay = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1)

      const mockMemos = [
        {
          id: "1",
          created_at: sameDayLastYear.toISOString(),
          owner_id: "user-1",
          is_private: true,
        },
        {
          id: "2",
          created_at: differentDay.toISOString(),
          owner_id: "user-1",
          is_private: false,
        },
      ]

      const mockQuery = makeMockQuery(mockMemos)
      mockSelect.mockReturnValue(mockQuery)
      vi.mocked(getCurrentUserId).mockResolvedValue("user-2") // 模拟不同用户登录

      const result = await getOnThisDayMemos()
      expect(result.success).toBe(true)
      // 应该只保留去年今日的数据（过滤掉了不同日期的数据）
      expect(result.data).toHaveLength(1)

      const memo1 = result.data[0]
      expect(memo1.id).toBe("1")
      expect(memo1.is_locked).toBe(true) // 别人拥有的私密记录，被锁定
    })
  })

  describe("getBacklinks", () => {
    it("should search backlinks through content and tags without crashing", async () => {
      const mockMemos = [
        {
          id: "1",
          content: "Check @42 now",
          owner_id: "user-1",
          is_private: false,
        },
        {
          id: "2",
          content: "No mentions here",
          owner_id: "user-1",
          is_private: false,
        },
        {
          id: "3",
          content: "Mentions @420 but not 42",
          owner_id: "user-1",
          is_private: false,
        },
      ]

      const mockQuery = makeMockQuery(mockMemos)
      mockSelect.mockReturnValue(mockQuery)

      const result = await getBacklinks(42)
      expect(result.success).toBe(true)
      // 应该只保留精准匹配了 @42(非数字结尾) 的 memo-1，过滤掉 memo-3 和 memo-2
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe("1")
    })
  })
})
