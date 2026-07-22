import { describe, expect, it } from "vitest"

import {
  getGalleryCacheKey,
  getHomeCacheKey,
  getMapCacheKey,
  getTagsCacheKey,
  getTrashCacheKey,
} from "./page-cache-keys"

describe("page cache keys", () => {
  it("keeps URL state, viewer identity, and unlocked memo ids isolated", () => {
    const homeKey = getHomeCacheKey({ tag: "随笔", query: "夏天", ignored: "value" }, "viewer-1", [
      "memo-b",
      "memo-a",
    ])

    expect(homeKey).toBe(
      "/?query=%E5%A4%8F%E5%A4%A9&tag=%E9%9A%8F%E7%AC%94::viewer=viewer-1::unlocked=memo-a,memo-b"
    )
    expect(getHomeCacheKey({ tag: "随笔" }, "viewer-2", ["memo-a"])).not.toBe(homeKey)
    expect(getHomeCacheKey({ tag: "随笔" }, "viewer-1", [])).not.toBe(homeKey)
  })

  it("scopes derived page caches to every visibility boundary they consume", () => {
    expect(getGalleryCacheKey("viewer-1", ["memo-b", "memo-a"])).toBe(
      "/gallery::viewer=viewer-1::unlocked=memo-a,memo-b"
    )
    expect(getMapCacheKey(null, [])).toBe("/map::viewer=anonymous::unlocked=none")
    expect(getTagsCacheKey("viewer-1")).toBe("/tags::viewer=viewer-1")
    expect(getTrashCacheKey("viewer-1")).toBe("/trash::viewer=viewer-1")
  })
})
