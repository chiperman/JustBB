import { describe, it, expect, vi, beforeEach } from "vitest"
import { getMemoStats, exportMemos } from "../memos/analytics"
import { getSupabaseUsageStats } from "./index"
import { getAdminClient } from "@/lib/supabase"
import {
  getCurrentUser,
  getCurrentUserId,
  isAdmin,
} from "@/features/auth/actions"

// Mock Supabase Instance
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  is: vi.fn().mockResolvedValue({
    data: [
      {
        created_at: "2024-01-01T00:00:00.000Z",
        word_count: 10,
        tags: ["tag-a", "tag-b"],
        is_private: false,
        owner_id: "user-1",
      },
      {
        created_at: "2024-01-02T00:00:00.000Z",
        word_count: 20,
        tags: ["tag-c"],
        is_private: true,
        owner_id: "user-1",
      },
      {
        created_at: "2024-01-03T00:00:00.000Z",
        word_count: 30,
        tags: ["tag-d"],
        is_private: true,
        owner_id: "other-user",
      },
    ],
    error: null,
  }),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  rpc: vi.fn().mockImplementation((name) => {
    if (name === "get_memo_stats_v2") {
      return {
        data: {
          totalMemos: 2,
          totalTags: 3,
          firstMemoDate: "2024-01-01",
          days: {
            "2024-01-01": { count: 1, wordCount: 10 },
            "2024-01-02": { count: 1, wordCount: 20 },
          },
        },
        error: null,
      }
    }
    return { data: 100 * 1024 * 1024, error: null }
  }),
  schema: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [{ metadata: { size: 10 * 1024 * 1024 } }],
        error: null,
      }),
    })),
  })),
  auth: {
    admin: {
      listUsers: vi.fn().mockResolvedValue({
        data: { users: [{ id: "user-1" }], total: 12 },
        error: null,
      }),
    },
  },
}

vi.mock("@/lib/supabase", () => ({
  getAdminClient: vi.fn(() => mockSupabase),
  getClient: vi.fn(async () => mockSupabase),
}))

vi.mock("@/features/auth/actions", () => ({
  getCurrentUser: vi.fn(async () => ({
    id: "user-1",
    email: "user@example.com",
    created_at: "2024-01-01T00:00:00.000Z",
    role: "admin",
  })),
  getCurrentUserId: vi.fn(async () => "user-1"),
  isAdmin: vi.fn(async () => true),
}))

describe("getMemoStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllMocks()
    process.env.SUPABASE_MANAGEMENT_API_KEY = ""
    process.env.SUPABASE_PROJECT_REF = ""
    // Reset rpc mock to default implementation
    mockSupabase.rpc = vi.fn().mockImplementation((name) => {
      if (name === "get_memo_stats_v2") {
        return {
          data: {
            totalMemos: 2,
            totalTags: 3,
            firstMemoDate: "2024-01-01",
            days: {
              "2024-01-01": { count: 1, wordCount: 10 },
              "2024-01-02": { count: 1, wordCount: 20 },
            },
          },
          error: null,
        }
      }
      return { data: 100 * 1024 * 1024, error: null }
    })
  })

  it("应该能正确获取基础统计数据", async () => {
    const result = await getMemoStats()

    expect(result.success).toBe(true)
    expect(result.data?.totalMemos).toBe(2)
    expect(result.data?.totalTags).toBe(3)
  })

  it("当数据库报错时应该返回零值对象", async () => {
    mockSupabase.rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { message: "Database failure" },
      })

    const result = await getMemoStats()

    expect(result.success).toBe(false)
    expect(result.data?.totalMemos).toBe(0)
    expect(result.error).toBe("Database failure")
  })

  it("当未登录时应该拒绝导出", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null)

    const result = await exportMemos("markdown")

    expect(result.success).toBe(false)
    expect(result.error).toBe("未登录，无法导出数据")
    expect(result.data).toBe("")
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it("当管理员导出时应该返回格式化数据", async () => {
    mockSupabase.from.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.is = vi.fn().mockReturnThis()
    mockSupabase.eq = vi.fn().mockReturnThis()
    mockSupabase.order = vi.fn().mockResolvedValue({
      data: [
        {
          content: "测试内容",
          created_at: "2024-01-01T00:00:00.000Z",
          tags: ["tag-a"],
        },
      ],
      error: null,
    })

    const result = await exportMemos("json")

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
    expect(result.data).toContain("测试内容")
  })

  it("应该在 fallback 模式下返回完整的 Supabase 用量结构", async () => {
    vi.mocked(isAdmin).mockResolvedValueOnce(true)

    const result = await getSupabaseUsageStats()

    expect(result.success).toBe(true)
    expect(result.isFullIndicator).toBe(false)
    expect(result.data?.db.used).toBe(100)
    expect(result.data?.storage.used).toBe(10)
    expect(result.data?.mau.used).toBe(12)
    expect(result.data?.egress.limit).toBe(5)
  })

  it("未登录时不应该获取 Supabase 用量", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

    const result = await getSupabaseUsageStats()

    expect(result.success).toBe(false)
    expect(result.error).toBe("未登录，无法查看服务用量")
  })

  it("当 RPC 失败时使用 pg_total_relation_size 而非全表扫描", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null)
    vi.mocked(isAdmin).mockResolvedValueOnce(true)
    process.env.SUPABASE_MANAGEMENT_API_KEY = ""
    process.env.SUPABASE_PROJECT_REF = ""

    // 模拟 get_database_size RPC 失败
    vi.mocked(getAdminClient).mockImplementationOnce(() => ({
      ...mockSupabase,
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error("rpc failed") }),
    }))

    const result = await getSupabaseUsageStats()

    expect(result.success).toBe(true)
    // 不应有 .from("memos").select("content, tags, ...") 全表扫描
    const fromCalls = mockSupabase.from.mock.calls
    const memoScanCalls = fromCalls.filter(
      (call) => Array.isArray(call) && call[0] === "memos"
    )
    const selectContentCalls = mockSupabase.select.mock.calls.filter(
      (call) => Array.isArray(call) && call.includes("content")
    )
    expect(memoScanCalls.length).toBe(0)
    expect(selectContentCalls.length).toBe(0)
  })

  it("非管理员不应该获取 Supabase 用量", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      created_at: "2024-01-01T00:00:00.000Z",
      role: "user",
    })
    vi.mocked(isAdmin).mockResolvedValueOnce(false)

    const result = await getSupabaseUsageStats()

    expect(result.success).toBe(false)
    expect(result.error).toBe("权限不足")
  })
})
