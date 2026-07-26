import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "MainLayoutClient.tsx")
const source = readFileSync(sourcePath, "utf8")

describe("MainLayoutClient scroll-to-top control", () => {
  it("keeps the control mounted and only animates its visual state", () => {
    expect(source).toContain("initial={false}")
    expect(source).toContain("opacity: showScrollTop ? 1 : 0")
    expect(source).toContain("y: showScrollTop ? 0 : 8")
    expect(source).not.toContain('key="back-to-top"')
  })

  it("保留隐私安全缓存和延迟骨架，同时让移动端使用页面滚动", () => {
    expect(source).toContain("const { cacheKey: viewerCacheKey, query } = useViewerQuery()")
    expect(source).toContain('const cacheKey = viewerCacheKey("/", flattenedParams)')
    expect(source).toContain("const res = await query(")
    expect(source).toContain("getViewerFeedMemos,")
    expect(source).toContain("useDelayedLoadingVisibility(isLoading)")
    expect(source).toContain("showInitialSkeleton ?")
    expect(source).toContain("isMobileViewport ? window : container")
    expect(source).toContain("scrollContainerRef={isMobileViewport ? undefined : containerRef}")
  })
})
