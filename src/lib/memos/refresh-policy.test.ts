import { describe, expect, it } from "vitest"
import type { Memo } from "@/types/memo"
import { shouldRefreshMemoDomain } from "./refresh-policy"

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

describe("memo derived refresh policy", () => {
  it("集合变化刷新所有派生域", () => {
    for (const domain of [
      "cache",
      "stats",
      "tags",
      "map",
      "daily",
      "timeline",
      "on-this-day",
    ] as const) {
      expect(shouldRefreshMemoDomain({ type: "create", memo }, domain)).toBe(true)
      expect(shouldRefreshMemoDomain({ type: "restore", id: memo.id }, domain)).toBe(true)
    }
  })

  it("置顶只影响页面缓存，不刷新统计与标签", () => {
    const event = { type: "update", id: memo.id, updates: { is_pinned: true } } as const
    expect(shouldRefreshMemoDomain(event, "cache")).toBe(true)
    expect(shouldRefreshMemoDomain(event, "stats")).toBe(false)
    expect(shouldRefreshMemoDomain(event, "tags")).toBe(false)
  })

  it("定位变化只刷新缓存与地图域", () => {
    const event = {
      type: "update",
      id: memo.id,
      updates: { locations: [{ name: "上海", latitude: 31.2, longitude: 121.5 }] },
    } as const
    expect(shouldRefreshMemoDomain(event, "cache")).toBe(true)
    expect(shouldRefreshMemoDomain(event, "map")).toBe(true)
    expect(shouldRefreshMemoDomain(event, "stats")).toBe(false)
    expect(shouldRefreshMemoDomain(event, "tags")).toBe(false)
  })

  it("正文与可见性变化刷新依赖正文的派生域", () => {
    const event = {
      type: "update",
      id: memo.id,
      updates: { content: "updated", is_private: true },
    } as const
    expect(shouldRefreshMemoDomain(event, "stats")).toBe(true)
    expect(shouldRefreshMemoDomain(event, "tags")).toBe(true)
    expect(shouldRefreshMemoDomain(event, "daily")).toBe(true)
    expect(shouldRefreshMemoDomain(event, "on-this-day")).toBe(true)
  })
})
