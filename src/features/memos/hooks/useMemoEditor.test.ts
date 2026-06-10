// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMemoEditor } from "./useMemoEditor"

// Mock server actions
const mockCreateMemo = vi.fn()
const mockUpdateMemoContent = vi.fn()

vi.mock("@/lib/supabase", () => ({
  getClient: vi.fn(),
  getAdminClient: vi.fn(),
}))

vi.mock("@/server/actions/memos/mutate", () => ({
  createMemo: (...args: any[]) => mockCreateMemo(...args),
  updateMemoContent: (...args: any[]) => mockUpdateMemoContent(...args),
}))

// Mock events
vi.mock("@/lib/memos/events", () => ({
  dispatchMemoEvent: vi.fn(),
}))

// Mock cache
vi.mock("@/shared/lib/memo-cache", () => ({
  memoCache: {
    addItem: vi.fn(),
  },
}))

// Mock context
vi.mock("@/state/TagsContext", () => ({
  useTags: () => ({ refreshTags: vi.fn() }),
}))

vi.mock("@/state/StatsContext", () => ({
  useStats: () => ({ refreshStats: vi.fn() }),
}))

// Mock toast
vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe("useMemoEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("create mode", () => {
    it("should initialize with empty content", () => {
      const { result } = renderHook(() => useMemoEditor({ mode: "create" }))
      expect(result.current.content).toBe("")
      expect(result.current.isPrivate).toBe(false)
      expect(result.current.isPinned).toBe(false)
      expect(result.current.accessCode).toBe("")
      expect(result.current.error).toBe(null)
    })

    it("should toggle isPrivate and save draft flag", () => {
      const { result } = renderHook(() => useMemoEditor({ mode: "create" }))

      act(() => {
        result.current.handleTogglePrivate()
      })

      expect(result.current.isPrivate).toBe(true)

      act(() => {
        result.current.handleTogglePrivate()
      })

      expect(result.current.isPrivate).toBe(false)
      expect(result.current.accessCode).toBe("")
      expect(result.current.accessHint).toBe("")
    })

    it("should handle cancel in create mode: clear content and reset state", () => {
      const { result } = renderHook(() => useMemoEditor({ mode: "create" }))

      act(() => {
        result.current.setContent("test content")
        result.current.setIsPrivate(true)
        result.current.setAccessCode("1234")
        result.current.setIsPinned(true)
        localStorage.setItem("memo_editor_draft_content", "{}")
      })

      act(() => {
        result.current.handleCancel()
      })

      expect(result.current.content).toBe("")
      expect(result.current.isPrivate).toBe(false)
      expect(result.current.accessCode).toBe("")
      expect(result.current.isPinned).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it("should set error when publishing empty content", async () => {
      const { result } = renderHook(() => useMemoEditor({ mode: "create" }))

      await act(async () => {
        result.current.performPublish(null)
      })

      expect(result.current.error).toBe("内容为空，无法保存。")
    })

    it("should prevent double-submit via isPending", async () => {
      mockCreateMemo.mockResolvedValue({ success: true, data: null })

      const { result } = renderHook(() => useMemoEditor({ mode: "create" }))

      act(() => {
        result.current.setContent("not empty")
        result.current.setIsPending(true)
      })

      await act(async () => {
        result.current.performPublish(null)
      })

      expect(result.current.error).toBe("正在提交，请稍候。")
    })
  })

  describe("edit mode", () => {
    it("should initialize with memo data", () => {
      const memo = {
        id: "test-123",
        content: "existing content",
        is_private: true,
        is_pinned: false,
      } as any

      const { result } = renderHook(() =>
        useMemoEditor({ mode: "edit", initialMemo: memo })
      )

      expect(result.current.content).toBe("existing content")
      expect(result.current.isPrivate).toBe(true)
      expect(result.current.isPinned).toBe(false)
    })

    it("should call onCancel when canceling in edit mode", () => {
      const onCancel = vi.fn()
      const { result } = renderHook(() =>
        useMemoEditor({ mode: "edit", onCancel })
      )

      act(() => {
        result.current.handleCancel()
      })

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it("should NOT clear content when canceling in edit mode", () => {
      const memo = {
        id: "test-123",
        content: "keep this",
        is_private: false,
        is_pinned: false,
      } as any

      const { result } = renderHook(() =>
        useMemoEditor({ mode: "edit", initialMemo: memo })
      )

      act(() => {
        result.current.handleCancel()
      })

      expect(result.current.content).toBe("keep this")
    })
  })
})
