// @vitest-environment jsdom
import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { shouldSkipNavigationPrefetch, useSidebarPagePrefetch } from "./useSidebarPagePrefetch"

const mocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  getGalleryMemos: vi.fn(),
  getMemosWithLocations: vi.fn(),
  getAllTags: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: mocks.prefetch }),
}))

vi.mock("@/server/actions/memos/query", () => ({
  getGalleryMemos: mocks.getGalleryMemos,
  getMemosWithLocations: mocks.getMemosWithLocations,
}))

vi.mock("@/server/actions/memos/analytics", () => ({
  getAllTags: mocks.getAllTags,
}))

vi.mock("@/state/PageDataCache", () => ({
  usePageDataCache: () => ({ getCache: vi.fn(() => null), setCache: vi.fn() }),
}))

vi.mock("@/state/UnlockedMemosContext", () => ({
  useUnlockedMemos: () => ({ unlockedMemoIds: [] }),
}))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({ user: { id: "viewer-1" } }),
}))

function PrefetchProbe() {
  const { prefetchPage } = useSidebarPagePrefetch()
  const [status, setStatus] = useState("idle")
  return (
    <>
      <button onClick={() => void prefetchPage("/gallery").then(() => setStatus("done"))}>
        预取画廊
      </button>
      <span data-testid="prefetch-status">{status}</span>
    </>
  )
}

describe("useSidebarPagePrefetch", () => {
  beforeEach(() => {
    mocks.prefetch.mockReset()
    mocks.getGalleryMemos.mockReset()
    mocks.getMemosWithLocations.mockReset()
    mocks.getAllTags.mockReset()
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true })
    Object.defineProperty(window.navigator, "connection", {
      configurable: true,
      value: undefined,
    })
  })

  it("contains route and data prefetch failures", async () => {
    mocks.prefetch.mockImplementation(() => {
      throw new Error("route prefetch failed")
    })
    mocks.getGalleryMemos.mockRejectedValue(new Error("data prefetch failed"))
    render(<PrefetchProbe />)

    fireEvent.click(screen.getByRole("button", { name: "预取画廊" }))

    await waitFor(() => expect(mocks.getGalleryMemos).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId("prefetch-status").textContent).toBe("done"))
  })

  it("skips prefetch for Save-Data and constrained networks", () => {
    Object.defineProperty(window.navigator, "connection", {
      configurable: true,
      value: { saveData: true, effectiveType: "4g" },
    })
    expect(shouldSkipNavigationPrefetch()).toBe(true)

    Object.defineProperty(window.navigator, "connection", {
      configurable: true,
      value: { saveData: false, effectiveType: "2g" },
    })
    expect(shouldSkipNavigationPrefetch()).toBe(true)
  })
})
