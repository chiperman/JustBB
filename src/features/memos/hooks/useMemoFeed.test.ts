import { describe, expect, it } from "vitest"
import { Memo } from "@/types/memo"
import {
  reconcileHasMoreOlder,
  reconcileInitialMemoWindow,
  reconcileUpdatedMemo,
} from "./useMemoFeed"

function createMemo(
  id: string,
  createdAt: string,
  overrides: Partial<Memo> = {}
): Memo {
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

describe("reconcileInitialMemoWindow", () => {
  it("preserves older loaded memos while replacing the refreshed first page window", () => {
    const staleTopMemo = createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
      content: "stale top",
    })
    const staleSecondMemo = createMemo("memo-2", "2026-04-02T00:00:00.000Z")
    const olderLoadedMemo = createMemo("memo-3", "2026-03-25T00:00:00.000Z")

    const nextInitialMemos = [
      createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
        content: "fresh top",
      }),
      createMemo("memo-4", "2026-04-01T00:00:00.000Z"),
    ]

    const reconciled = reconcileInitialMemoWindow(
      [staleTopMemo, staleSecondMemo, olderLoadedMemo],
      new Set(["memo-1", "memo-2"]),
      nextInitialMemos
    )

    expect(reconciled.map((memo) => memo.id)).toEqual([
      "memo-1",
      "memo-4",
      "memo-3",
    ])
    expect(reconciled[0].content).toBe("fresh top")
  })

  it("preserves locally unlocked status and content when merging fresh locked top memos", () => {
    const staleTopMemo = createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
      is_private: true,
      is_locked: false,
      content: "unlocked content",
    })
    const staleSecondMemo = createMemo("memo-2", "2026-04-02T00:00:00.000Z")

    const nextInitialMemos = [
      createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
        is_private: true,
        is_locked: true,
        content: "",
      }),
      createMemo("memo-4", "2026-04-01T00:00:00.000Z"),
    ]

    const reconciled = reconcileInitialMemoWindow(
      [staleTopMemo, staleSecondMemo],
      new Set(["memo-1", "memo-2"]),
      nextInitialMemos
    )

    const memo1 = reconciled.find((m) => m.id === "memo-1")
    expect(memo1?.is_locked).toBe(false)
    expect(memo1?.content).toBe("unlocked content")
  })
})

describe("reconcileHasMoreOlder", () => {
  it("does not reopen pagination once the older feed has been exhausted", () => {
    const nextInitialMemos = Array.from({ length: 30 }, (_, index) =>
      createMemo(
        `memo-${index + 1}`,
        `2026-04-${String(30 - index).padStart(2, "0")}T00:00:00.000Z`
      )
    )

    expect(reconcileHasMoreOlder(false, nextInitialMemos)).toBe(false)
  })

  it("closes pagination when the refreshed first page is shorter than one page", () => {
    const nextInitialMemos = Array.from({ length: 12 }, (_, index) =>
      createMemo(
        `memo-${index + 1}`,
        `2026-04-${String(12 - index).padStart(2, "0")}T00:00:00.000Z`
      )
    )

    expect(reconcileHasMoreOlder(true, nextInitialMemos)).toBe(false)
  })
})

describe("reconcileUpdatedMemo", () => {
  it("preserves viewer-scoped flags when the update payload omits derived fields", () => {
    const existingMemo = createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
      is_owner: true,
      is_locked: false,
      content: "before",
    })
    const updatedMemo = createMemo("memo-1", "2026-04-03T00:00:00.000Z", {
      content: "after",
    })
    delete (updatedMemo as Partial<Memo>).is_owner
    delete (updatedMemo as Partial<Memo>).is_locked

    const reconciled = reconcileUpdatedMemo(existingMemo, updatedMemo)

    expect(reconciled.content).toBe("after")
    expect(reconciled.is_owner).toBe(true)
    expect(reconciled.is_locked).toBe(false)
  })
})
