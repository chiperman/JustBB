 
import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateMemoState } from "./mutate"

const MOCK_MEMO_ID = "11111111-1111-1111-1111-111111111111"
const VIEWER_ID = "22222222-2222-2222-2222-222222222222"
const NOW = new Date("2026-07-08T03:42:53.000Z")

function createMemoResult(overrides: Record<string, unknown> = {}) {
  return {
    id: MOCK_MEMO_ID,
    memo_number: 571,
    owner_id: VIEWER_ID,
    content: "啥发啥地方",
    tags: [],
    access_code_hint: null,
    is_private: false,
    is_pinned: false,
    pinned_at: null,
    created_at: "2026-07-08T03:40:00.000Z",
    updated_at: "2026-07-08T03:40:00.000Z",
    deleted_at: null,
    word_count: 5,
    locations: null,
    images: [],
    access_code_hash: null,
    ...overrides,
  }
}

function buildMockSupabase() {
  const single = vi.fn()
  const select = vi.fn().mockReturnValue({ single })
  const eqOwner = vi.fn().mockReturnValue({ select })
  const eqId = vi.fn().mockReturnValue({ eq: eqOwner })
  const update = vi.fn().mockReturnValue({ eq: eqId })
  const from = vi.fn().mockReturnValue({ update })

  return {
    from,
    update,
    eqId,
    eqOwner,
    select,
    single,
  }
}

const mockClient = buildMockSupabase()

vi.mock("@/lib/supabase", () => ({
  getClient: vi.fn(async () => mockClient),
  getAdminClient: vi.fn(() => mockClient),
}))

vi.mock("@/features/auth/actions", () => ({
  getCurrentUserId: vi.fn(async () => VIEWER_ID),
  isAdmin: vi.fn(async () => true),
}))

vi.mock("@/lib/memos/visibility", () => ({
  withViewerAccess: vi.fn((memo: Record<string, unknown>) => memo),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("bcryptjs", () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue("salt"),
    hash: vi.fn().mockImplementation((code: string) => Promise.resolve(`hashed:${code}`)),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

describe("updateMemoState", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    mockClient.single.mockResolvedValue({
      data: createMemoResult({ is_pinned: true, pinned_at: NOW.toISOString() }),
      error: null,
    })
  })

  it("置顶时应同步写入 pinned_at，保证刷新后仍按置顶时间排序", async () => {
    const formData = new FormData()
    formData.append("id", MOCK_MEMO_ID)
    formData.append("is_pinned", "true")

    const result = await updateMemoState(formData)

    expect(result.success).toBe(true)
    expect(mockClient.update).toHaveBeenCalledWith({
      is_pinned: true,
      pinned_at: NOW.toISOString(),
    })
  })

  it("取消置顶时应清空 pinned_at", async () => {
    mockClient.single.mockResolvedValue({
      data: createMemoResult({ is_pinned: false, pinned_at: null }),
      error: null,
    })
    const formData = new FormData()
    formData.append("id", MOCK_MEMO_ID)
    formData.append("is_pinned", "false")

    const result = await updateMemoState(formData)

    expect(result.success).toBe(true)
    expect(mockClient.update).toHaveBeenCalledWith({
      is_pinned: false,
      pinned_at: null,
    })
  })
})
