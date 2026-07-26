// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const viewerState = vi.hoisted(() => ({
  user: { id: "viewer-1" } as { id: string } | null,
  unlockedMemoIds: ["memo-b", "memo-a"],
}))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({ user: viewerState.user }),
}))

vi.mock("@/state/UnlockedMemosContext", () => ({
  useUnlockedMemos: () => ({ unlockedMemoIds: viewerState.unlockedMemoIds }),
}))

import { useViewerQuery } from "./useViewerQuery"

describe("useViewerQuery", () => {
  beforeEach(() => {
    viewerState.user = { id: "viewer-1" }
    viewerState.unlockedMemoIds = ["memo-b", "memo-a"]
  })

  it("缓存 key 同时隔离查看者与排序后的解锁集合", () => {
    const { result } = renderHook(() => useViewerQuery())

    expect(result.current.cacheKey("/gallery")).toBe(
      "/gallery::viewer=viewer-1::unlocked=memo-a,memo-b"
    )
  })

  it("首页筛选参数与查看者作用域进入同一个 key", () => {
    const { result } = renderHook(() => useViewerQuery())

    expect(result.current.cacheKey("/", { tag: "旅行", year: "2026" })).toBe(
      "/?tag=%E6%97%85%E8%A1%8C&year=2026::viewer=viewer-1::unlocked=memo-a,memo-b"
    )
  })

  it("query 自动把解锁集合注入查询函数末尾", async () => {
    const run = vi.fn(async (limit: number, unlockedMemoIds: string[]) => ({
      limit,
      unlockedMemoIds,
    }))
    const { result } = renderHook(() => useViewerQuery())

    await expect(result.current.query(run, 20)).resolves.toEqual({
      limit: 20,
      unlockedMemoIds: ["memo-b", "memo-a"],
    })
    expect(run).toHaveBeenCalledWith(20, ["memo-b", "memo-a"])
  })

  it("查看者与解锁集合变化后，key 和查询注入同步更新", async () => {
    const run = vi.fn(async (unlockedMemoIds: string[]) => unlockedMemoIds)
    const { result, rerender } = renderHook(() => useViewerQuery())

    viewerState.user = null
    viewerState.unlockedMemoIds = ["memo-c"]
    act(() => rerender())

    expect(result.current.cacheKey("/map")).toBe("/map::viewer=anonymous::unlocked=memo-c")
    await expect(result.current.query(run)).resolves.toEqual(["memo-c"])
  })
})
