import { describe, expect, it } from "vitest"
import { shouldRefreshMemoDerivedData } from "./events"
import { Memo } from "@/types/memo"

const memo = {
  id: "memo-1",
  content: "hello",
  created_at: "2026-04-30T00:00:00.000Z",
  updated_at: "2026-04-30T00:00:00.000Z",
  is_pinned: false,
  is_private: false,
  memo_number: 1,
  owner_id: "user-1",
  tags: [],
  access_code_hint: null,
  pinned_at: null,
  deleted_at: null,
  word_count: 1,
  locations: [],
} satisfies Memo

describe("shouldRefreshMemoDerivedData", () => {
  it("refreshes derived memo views after collection changes", () => {
    expect(shouldRefreshMemoDerivedData({ type: "create", memo })).toBe(true)
    expect(shouldRefreshMemoDerivedData({ type: "delete", id: memo.id })).toBe(
      true
    )
  })

  it("refreshes derived memo views after visibility or content changes", () => {
    expect(
      shouldRefreshMemoDerivedData({
        type: "update",
        id: memo.id,
        updates: { is_private: true },
      })
    ).toBe(true)
  })

  it("ignores updates that do not affect derived memo views", () => {
    expect(
      shouldRefreshMemoDerivedData({
        type: "update",
        id: memo.id,
        updates: { is_pinned: true },
      })
    ).toBe(false)
  })
})
