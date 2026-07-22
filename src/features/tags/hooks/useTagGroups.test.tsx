// @vitest-environment jsdom
import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { getTagsCacheKey } from "@/shared/lib/page-cache-keys"
import { PageDataCacheProvider, usePageDataCache } from "@/state/PageDataCache"

import { useTagGroups } from "./useTagGroups"

const mocks = vi.hoisted(() => ({ getAllTags: vi.fn() }))

vi.mock("@/server/actions/memos/analytics", () => ({ getAllTags: mocks.getAllTags }))
vi.mock("@/state/UserContext", () => ({
  useUser: () => ({ user: { id: "viewer-1" } }),
}))

function TagProbe() {
  const { tags, isLoading } = useTagGroups()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="tags">{tags.map((tag) => tag.tag_name).join(",")}</span>
    </div>
  )
}

function SeededTagProbe() {
  const { setCache } = usePageDataCache()
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setCache(getTagsCacheKey("viewer-1"), { tags: [{ tag_name: "缓存标签", count: 2 }] })
    setReady(true)
  }, [setCache])

  return ready ? <TagProbe /> : null
}

describe("useTagGroups", () => {
  it("renders cached content immediately and refreshes it in the background", async () => {
    let resolveRefresh: ((value: unknown) => void) | undefined
    mocks.getAllTags.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      })
    )

    render(
      <PageDataCacheProvider>
        <SeededTagProbe />
      </PageDataCacheProvider>
    )

    expect(screen.getByTestId("tags").textContent).toContain("缓存标签")
    expect(screen.getByTestId("loading").textContent).toBe("false")
    expect(mocks.getAllTags).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRefresh?.({
        success: true,
        error: null,
        data: [{ tag_name: "刷新标签", count: 3 }],
      })
    })

    await waitFor(() => expect(screen.getByTestId("tags").textContent).toContain("刷新标签"))
  })
})
