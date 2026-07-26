import { describe, expect, it } from "vitest"
import type { Memo } from "@/types/memo"
import {
  createMemoFeedWindow,
  MEMO_FEED_PAGE_SIZE,
  reduceMemoFeedWindow,
} from "@/features/memos/lib/memo-feed-reconciler"

function createMemo(id: string, createdAt: string, overrides: Partial<Memo> = {}): Memo {
  return {
    id,
    content: `memo-${id}`,
    created_at: createdAt,
    updated_at: createdAt,
    is_pinned: false,
    is_private: false,
    memo_number: Number(id.replace(/\D/g, "")) || 0,
    owner_id: "user-1",
    tags: [],
    access_code_hint: null,
    pinned_at: null,
    deleted_at: null,
    word_count: 1,
    locations: [],
    ...overrides,
  }
}

describe("memo feed reconciler", () => {
  it("首屏刷新替换窗口，同时保留已经加载的旧页", () => {
    const first = createMemo("memo-1", "2026-04-03T00:00:00.000Z", { content: "stale" })
    const second = createMemo("memo-2", "2026-04-02T00:00:00.000Z")
    const older = createMemo("memo-3", "2026-03-25T00:00:00.000Z")
    let state = createMemoFeedWindow([first, second], {})
    state = { ...state, memos: [first, second, older] }

    state = reduceMemoFeedWindow(state, {
      type: "receive-initial",
      memos: [
        createMemo("memo-1", "2026-04-03T00:00:00.000Z", { content: "fresh" }),
        createMemo("memo-4", "2026-04-01T00:00:00.000Z"),
      ],
      searchParams: {},
    })

    expect(state.memos.map((memo) => memo.id)).toEqual(["memo-1", "memo-4", "memo-3"])
    expect(state.memos[0].content).toBe("fresh")
  })

  it("首屏刷新不会用锁定占位覆盖本地已解锁正文", () => {
    const unlocked = createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
      is_private: true,
      is_locked: false,
      content: "unlocked content",
    })
    const state = reduceMemoFeedWindow(createMemoFeedWindow([unlocked], {}), {
      type: "receive-initial",
      memos: [
        createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
          is_private: true,
          is_locked: true,
          content: "",
        }),
      ],
      searchParams: {},
    })

    expect(state.memos[0].is_locked).toBe(false)
    expect(state.memos[0].content).toBe("unlocked content")
  })

  it("筛选条件变化时完整重置窗口和分页状态", () => {
    const initial = Array.from({ length: MEMO_FEED_PAGE_SIZE }, (_, index) =>
      createMemo(
        `memo-${index + 1}`,
        `2026-04-${String(30 - index).padStart(2, "0")}T00:00:00.000Z`
      )
    )
    const next = [createMemo("memo-99", "2026-05-01T00:00:00.000Z")]
    const state = reduceMemoFeedWindow(createMemoFeedWindow(initial, { tag: "旧" }), {
      type: "receive-initial",
      memos: next,
      searchParams: { tag: "新" },
    })

    expect(state.memos).toEqual(next)
    expect(state.hasMoreOlder).toBe(false)
  })

  it("分页追加去重，并在短页或无新数据时关闭分页", () => {
    const current = [
      createMemo("memo-1", "2026-04-03T00:00:00.000Z"),
      createMemo("memo-2", "2026-04-02T00:00:00.000Z"),
    ]
    let state = { ...createMemoFeedWindow(current, {}), hasMoreOlder: true }
    state = reduceMemoFeedWindow(state, {
      type: "append-older-page",
      memos: [
        createMemo("memo-2", "2026-04-02T00:00:00.000Z"),
        createMemo("memo-3", "2026-03-25T00:00:00.000Z"),
      ],
    })

    expect(state.memos.map((memo) => memo.id)).toEqual(["memo-1", "memo-2", "memo-3"])
    expect(state.hasMoreOlder).toBe(false)
  })

  it("替换 Memo 时保留调用结果缺失的查看者字段", () => {
    const existing = createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
      is_owner: true,
      is_locked: false,
      content: "before",
    })
    const updated = createMemo("memo-1", "2026-04-03T00:00:00.000Z", { content: "after" })
    delete (updated as Partial<Memo>).is_owner
    delete (updated as Partial<Memo>).is_locked

    const state = reduceMemoFeedWindow(createMemoFeedWindow([existing], {}), {
      type: "replace-memo",
      memo: updated,
    })

    expect(state.memos[0]).toMatchObject({
      content: "after",
      is_owner: true,
      is_locked: false,
    })
  })

  it("置顶事件负责重排窗口，并由显式动作结束重排状态", () => {
    const first = createMemo("memo-1", "2026-04-03T00:00:00.000Z")
    const second = createMemo("memo-2", "2026-04-02T00:00:00.000Z")
    let state = reduceMemoFeedWindow(createMemoFeedWindow([first, second], {}), {
      type: "memo-event",
      event: {
        type: "update",
        id: "memo-2",
        updates: { is_pinned: true, pinned_at: "2026-04-04T00:00:00.000Z" },
      },
    })

    expect(state.memos.map((memo) => memo.id)).toEqual(["memo-2", "memo-1"])
    expect(state.isPinReordering).toBe(true)

    state = reduceMemoFeedWindow(state, { type: "finish-pin-reorder" })
    expect(state.isPinReordering).toBe(false)
  })
})
