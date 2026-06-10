import { describe, it, expect } from "vitest"
import { withViewerAccess, canViewMemoContent } from "./visibility"
import type { Memo } from "@/types/memo"

const createMemo = (
  overrides: Partial<Memo> = {}
): Memo =>
  ({
    id: "test-id",
    memo_number: 1,
    owner_id: "owner-1",
    content: "test content",
    tags: [],
    is_private: false,
    is_pinned: false,
    pinned_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    word_count: 10,
    locations: null,
    access_code_hash: null,
    access_code_hint: null,
    ...overrides,
  } as Memo)

describe("canViewMemoContent", () => {
  it("公开 memo 任何人都可以查看", () => {
    const memo = createMemo({ is_private: false })
    expect(canViewMemoContent(memo, "viewer-1", [])).toBe(true)
    expect(canViewMemoContent(memo, null, [])).toBe(true)
  })

  it("私有 memo 所有者可以查看", () => {
    const memo = createMemo({ is_private: true, owner_id: "owner-1" })
    expect(canViewMemoContent(memo, "owner-1", [])).toBe(true)
    expect(canViewMemoContent(memo, null, [])).toBe(false)
  })

  it("私有 memo 在 unlockedIds 中包含 id 时可以查看", () => {
    const memo = createMemo({ is_private: true, owner_id: "owner-1" })
    expect(canViewMemoContent(memo, "viewer-1", ["test-id"])).toBe(true)
    expect(canViewMemoContent(memo, "viewer-1", [])).toBe(false)
  })
})

describe("withViewerAccess", () => {
  it("公开 memo 直接返回，is_locked 为 false", () => {
    const memo = createMemo({ is_private: false })
    const result = withViewerAccess(memo, "viewer-1", [])
    expect(result).not.toBeNull()
    expect(result!.is_locked).toBe(false)
    expect(result!.is_owner).toBe(false)
    expect(result!.content).toBe("test content")
  })

  it("私有 memo 所有者直接返回完整内容", () => {
    const memo = createMemo({ is_private: true, owner_id: "owner-1" })
    const result = withViewerAccess(memo, "owner-1", [])
    expect(result).not.toBeNull()
    expect(result!.is_locked).toBe(false)
    expect(result!.is_owner).toBe(true)
    expect(result!.content).toBe("test content")
  })

  it("私有 memo 非所有者且已解锁时返回完整内容", () => {
    const memo = createMemo({ is_private: true, owner_id: "owner-1" })
    const result = withViewerAccess(memo, "viewer-1", ["test-id"])
    expect(result).not.toBeNull()
    expect(result!.is_locked).toBe(false)
    expect(result!.is_owner).toBe(false)
    expect(result!.content).toBe("test content")
  })

  it("私有 memo 非所有者且未解锁时 allowLockedPlaceholder=false 返回 null", () => {
    const memo = createMemo({ is_private: true, owner_id: "owner-1" })
    const result = withViewerAccess(memo, "viewer-1", [])
    expect(result).toBeNull()
  })

  it("私有 memo 非所有者且未解锁时 allowLockedPlaceholder=true 返回脱敏数据", () => {
    const memo = createMemo({
      is_private: true,
      owner_id: "owner-1",
      content: "secret",
      tags: ["tag-a"],
      word_count: 50,
    })
    const result = withViewerAccess(memo, "viewer-1", [], {
      allowLockedPlaceholder: true,
    })
    expect(result).not.toBeNull()
    expect(result!.is_locked).toBe(true)
    expect(result!.is_owner).toBe(false)
    expect(result!.content).toBe("")
    expect(result!.tags).toEqual([])
    expect(result!.word_count).toBe(0)
  })

  it("is_owner 优先使用 memo 上的值", () => {
    const memo = createMemo({
      is_private: true,
      owner_id: "owner-1",
      is_owner: true,
    })
    const result = withViewerAccess(memo, "viewer-1", [])
    expect(result?.is_owner).toBe(true)
  })
})
