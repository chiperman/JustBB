import fs from "node:fs"
import path from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

let searchParamsString = "query=hello&tag=test"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => {
    const params = new URLSearchParams(searchParamsString)
    return {
      get: (key: string) => params.get(key),
      toString: () => params.toString(),
    }
  },
}))

vi.mock("@/state/UIContext", () => ({
  useSelection: () => ({
    isSelectionMode: false,
    toggleSelectionMode: vi.fn(),
    selectedIds: new Set(),
  }),
}))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({
    user: null,
    loading: false,
    setUser: vi.fn(),
  }),
}))

vi.mock("@/state/TagsContext", () => ({
  useTags: () => ({
    tags: [
      { tag_name: "test", count: 3 },
      { tag_name: "memo", count: 2 },
    ],
    isLoading: false,
    isMounted: true,
    refreshTags: vi.fn(),
  }),
}))

vi.mock("@/shared/hooks/useHasMounted", () => ({
  useHasMounted: () => true,
}))

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion")

  return {
    ...actual,
    useReducedMotion: () => false,
  }
})

import { SidebarCollapseButton } from "@/shared/layout/SidebarCollapseButton"
import { FeedHeader } from "./FeedHeader"
import { SearchInput } from "./SearchInput"
import { OnThisDay } from "./OnThisDay"
import { YearlyStats } from "./YearlyStats"
import { UsageProgress } from "@/features/admin/components/UsageProgress"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { TagCloud } from "./TagCloud"

describe("focus visibility regressions", () => {
  it("keeps a visible focus ring on the sidebar collapse button", () => {
    const html = renderToStaticMarkup(
      <SidebarCollapseButton
        isCollapsed={false}
        onClick={() => undefined}
        side="left"
        label="收起侧边栏"
      />
    )

    expect(html).toContain("focus-visible:ring-1")
    expect(html).toContain("focus-visible:ring-ring")
  })

  it("keeps visible focus styles on feed header entry points", () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <FeedHeader />
      </TooltipProvider>
    )

    expect(html).not.toContain("focus-visible:ring-0")
    expect(html).toContain("focus-visible:ring-1")
    expect(html).toContain("focus-visible:ring-ring")
    expect(html).toContain("focus-visible:ring-inset")
  })

  it("keeps visible focus styles on search input action buttons", () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )
    const focusMatches = html.match(/focus-visible:ring-1/g) ?? []

    expect(focusMatches.length).toBeGreaterThanOrEqual(1)
    expect(html).toContain("focus-visible:ring-ring")
  })

  it("keeps a visible focus ring on On This Day cards", () => {
    const html = renderToStaticMarkup(
      <OnThisDay
        initialMemos={[
          {
            id: "memo-1",
            content: "memo content",
            created_at: "2025-05-01T00:00:00.000Z",
          } as never,
        ]}
      />
    )

    expect(html).not.toContain("focus-visible:ring-0")
    expect(html).toContain("focus-visible:ring-1")
    expect(html).toContain("focus-visible:ring-ring")
  })

  it("keeps a visible focus ring on yearly stats action buttons", () => {
    const html = renderToStaticMarkup(
      <YearlyStats stats={{}} firstMemoDate="2025-05-01T00:00:00.000Z" />
    )

    expect(html).toContain("focus-visible:ring-1")
    expect(html).toContain("focus-visible:ring-ring")
  })

  it("keeps a visible focus ring on usage tooltip triggers", () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <UsageProgress label="数据库" used={128} limit={512} percentage={25} info="使用说明" />
      </TooltipProvider>
    )

    expect(html).toContain("focus-visible:ring-1")
    expect(html).toContain("focus-visible:ring-ring")
  })

  it("does not disable the ghost select trigger focus ring", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/shared/ui/select.tsx"), "utf8")

    expect(source).not.toContain("focus-visible:ring-0")
  })

  it("does not disable the heatmap modal year trigger focus ring", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/shared/ui/HeatmapModal.tsx"),
      "utf8"
    )

    expect(source).not.toContain("focus:ring-0 focus:ring-offset-0")
  })

  it("keeps visible focus styles on editor link actions", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/features/memos/components/editor/LinkNodeView.tsx"),
      "utf8"
    )

    expect(source).toContain("focus-visible:ring-1")
    expect(source).toContain("focus-visible:ring-ring")
  })

  it("keeps visible inset focus styles on popular tag chips", () => {
    searchParamsString = ""

    const html = renderToStaticMarkup(<TagCloud />)

    expect(html).toContain("focus-visible:ring-1")
    expect(html).toContain("focus-visible:ring-ring")
    expect(html).toContain("focus-visible:ring-inset")
  })
})
