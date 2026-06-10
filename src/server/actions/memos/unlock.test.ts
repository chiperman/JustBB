import { describe, it, expect, vi, beforeEach } from "vitest"
import { verifyUnlockCode, _resetVerifyTimestamps } from "./mutate"

const MOCK_MEMO_ID = "memo-uuid-123"
const CORRECT_CODE = "correct-password"

function createMemoResult(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: MOCK_MEMO_ID,
      memo_number: 42,
      owner_id: "owner-uuid",
      content: "secret memo",
      tags: ["test"],
      access_code_hint: "hint",
      is_private: true,
      is_pinned: false,
      pinned_at: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      deleted_at: null,
      word_count: 100,
      locations: null,
      access_code_hash: null,
      ...overrides,
    },
    error: null,
  }
}

function buildMockSupabase() {
  let singleResult: { data: unknown; error: unknown } | null = null

  const single = vi.fn().mockImplementation(() => {
    if (singleResult) return singleResult
    return {
      data: createMemoResult().data,
      error: null,
    } as { data: unknown; error: null }
  })

  const eq = vi.fn().mockImplementation(() => ({ single }))

  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return {
    from,
    eq,
    single,
    singleResult: {
      set: (val: { data: unknown; error: unknown } | null) => {
        singleResult = val
      },
    },
    mock: { from, eq, select, single },
  }
}

const mockClient = buildMockSupabase()

vi.mock("@/lib/supabase", () => ({
  getClient: vi.fn(async () => mockClient),
  getAdminClient: vi.fn(() => mockClient),
}))

vi.mock("@/features/auth/actions", () => ({
  getCurrentUserId: vi.fn(async () => "viewer-uuid"),
}))

vi.mock("@/lib/memos/visibility", () => ({
  withViewerAccess: vi.fn((memo: Record<string, unknown>) => memo),
}))

vi.mock("@/server/actions/shared/logger", () => ({
  logValidationFailure: vi.fn(),
  logDatabaseError: vi.fn(),
  formatActionError: vi.fn((msg) => msg),
}))

vi.mock("bcryptjs", () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue("salt"),
    hash: vi.fn().mockImplementation((code: string) =>
      Promise.resolve(`hashed:${code}`)
    ),
    compare: vi.fn().mockImplementation((code: string, hash: string) => {
      if (hash === null || hash === undefined) return Promise.resolve(false)
      const expectedHash = `hashed:${code}`
      return Promise.resolve(hash === expectedHash)
    }),
  },
}))

describe("verifyUnlockCode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetVerifyTimestamps()
    mockClient.singleResult.set(createMemoResult({ access_code_hash: `hashed:${CORRECT_CODE}` }))
  })

  it("缺少 memoId 应返回错误", async () => {
    const result = await verifyUnlockCode("", CORRECT_CODE)
    expect(result.success).toBe(false)
    expect(result.error).toBe("缺少 Memo ID")
  })

  it("口令正确时应返回成功", async () => {
    mockClient.singleResult.set(
      createMemoResult({ access_code_hash: `hashed:${CORRECT_CODE}` })
    )
    const result = await verifyUnlockCode(MOCK_MEMO_ID, CORRECT_CODE)
    expect(result.success).toBe(true)
  })

  it("口令错误时应返回错误", async () => {
    mockClient.singleResult.set(
      createMemoResult({ access_code_hash: "hashed:other-password" })
    )
    const result = await verifyUnlockCode(MOCK_MEMO_ID, CORRECT_CODE)
    expect(result.success).toBe(false)
    expect(result.error).toBe("口令错误")
  })

  it("未设置口令的 memo 应返回错误", async () => {
    mockClient.singleResult.set(createMemoResult({ access_code_hash: null }))
    const result = await verifyUnlockCode(MOCK_MEMO_ID, CORRECT_CODE)
    expect(result.success).toBe(false)
    expect(result.error).toBe("未设置访问口令")
  })

  it("数据库查询失败应返回错误", async () => {
    mockClient.singleResult.set({ data: null, error: { message: "query failed" } })
    const result = await verifyUnlockCode(MOCK_MEMO_ID, CORRECT_CODE)
    expect(result.success).toBe(false)
    expect(result.error).toBe("记录不存在")
  })

  it("速率限制：5 次尝试后应返回错误", async () => {
    // 设置为一个与调用 code 不同的 hash，确保每次都返回"口令错误"
    mockClient.singleResult.set(
      createMemoResult({ access_code_hash: "hashed:other-password" })
    )
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        verifyUnlockCode(MOCK_MEMO_ID, CORRECT_CODE)
      )
    )
    expect(results.slice(0, 5).every((r) => r.error === "口令错误")).toBe(true)
    expect(results[5].error).toBe("尝试次数过多，请稍后再试")
  })
})
