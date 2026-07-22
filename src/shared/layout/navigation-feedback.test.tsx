// @vitest-environment jsdom
import { useEffect, useState } from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { NAVIGATION_CONFIG } from "@/config/navigation"
import { useSidebarNavigation } from "@/shared/hooks/useSidebarNavigation"
import { LayoutProvider, NAVIGATION_FEEDBACK_TIMEOUT_MS } from "@/state/LayoutContext"
import { PageDataCacheProvider, usePageDataCache } from "@/state/PageDataCache"
import { getGalleryCacheKey } from "@/shared/lib/page-cache-keys"
import { getTagsCacheKey } from "@/shared/lib/page-cache-keys"
import { UIProvider } from "@/state/UIContext"

import { MobileNavbar } from "./MobileNavbar"
import { NavigationPendingBoundary } from "./NavigationPendingBoundary"
import { SidebarNavItem } from "./sidebar/SidebarNavItem"

const mocks = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  prefetchPage: vi.fn(async () => undefined),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.searchParams,
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({ user: null, setUser: vi.fn(), isAdmin: false }),
}))

vi.mock("@/shared/hooks/useSidebarPagePrefetch", () => ({
  useSidebarPagePrefetch: () => ({
    prefetchPage: mocks.prefetchPage,
    schedulePrefetch: vi.fn(),
    cancelPrefetch: vi.fn(),
  }),
}))

vi.mock("@/shared/ui/Heatmap", () => ({ Heatmap: () => null }))
vi.mock("@/features/admin/components/UsageModal", () => ({ UsageModal: () => null }))
vi.mock("./ExportConfigDialog", () => ({ ExportConfigDialog: () => null }))
vi.mock("./ImportConfigDialog", () => ({ ImportConfigDialog: () => null }))
vi.mock("@/features/settings/components/R2ConfigDialog", () => ({ R2ConfigDialog: () => null }))
vi.mock("@/features/auth/actions", () => ({ logout: vi.fn() }))
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { signOut: vi.fn() } } }))

function DesktopNavigation() {
  const { currentView, handleNavigate } = useSidebarNavigation()

  return (
    <nav aria-label="桌面导航">
      {NAVIGATION_CONFIG.filter((item) => !item.requiresAuth).map((item) => (
        <SidebarNavItem
          key={item.id}
          item={item}
          isActive={item.href === "/" ? currentView === "/" : currentView.startsWith(item.href)}
          isCollapsed={false}
          onClick={(href) => handleNavigate(href, false)}
        />
      ))}
    </nav>
  )
}

function renderWithLayout(children: React.ReactNode) {
  return render(<LayoutProvider>{children}</LayoutProvider>)
}

function SeedEmptyGalleryCache({ children }: { children: React.ReactNode }) {
  const { setCache } = usePageDataCache()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setCache(getGalleryCacheKey(null, []), { memos: [], hasMore: false })
    const readyTimer = window.setTimeout(() => setReady(true), 0)
    return () => window.clearTimeout(readyTimer)
  }, [setCache])

  return ready ? children : null
}

function SeedEmptyTagsCache({ children }: { children: React.ReactNode }) {
  const { setCache } = usePageDataCache()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setCache(getTagsCacheKey(null), { tags: [] })
    const readyTimer = window.setTimeout(() => setReady(true), 0)
    return () => window.clearTimeout(readyTimer)
  }, [setCache])

  return ready ? children : null
}

describe("navigation feedback", () => {
  beforeEach(() => {
    mocks.pathname = "/"
    mocks.push.mockReset()
    mocks.prefetchPage.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("immediately selects the desktop destination without prefetch", () => {
    renderWithLayout(<DesktopNavigation />)

    const galleryLink = screen.getByRole("link", { name: "画廊" })
    fireEvent.click(galleryLink)

    expect(mocks.push).toHaveBeenCalledWith("/gallery")
    expect(galleryLink.getAttribute("aria-current")).toBe("page")
    expect(mocks.prefetchPage).not.toHaveBeenCalled()
  })

  it("immediately selects the mobile destination", () => {
    renderWithLayout(<MobileNavbar />)

    const galleryLink = screen.getByRole("link", { name: "画廊" })
    fireEvent.click(galleryLink)

    expect(mocks.push).toHaveBeenCalledWith("/gallery")
    expect(galleryLink.getAttribute("aria-current")).toBe("page")
    expect(galleryLink.getAttribute("aria-busy")).toBe("true")
  })

  it("shows a destination-local skeleton while preserving the application shell", () => {
    vi.useFakeTimers()
    renderWithLayout(
      <div data-testid="application-shell">
        <DesktopNavigation />
        <NavigationPendingBoundary>
          <div data-testid="current-page">当前页面</div>
        </NavigationPendingBoundary>
      </div>
    )

    fireEvent.click(screen.getByRole("link", { name: "画廊" }))

    expect(screen.getByTestId("application-shell")).toBeTruthy()
    expect(screen.queryByTestId("current-page")).toBeNull()
    expect(document.querySelector('[data-navigation-skeleton="gallery"]')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(document.querySelector('[data-navigation-skeleton="gallery"]')).toBeTruthy()
    expect(screen.queryByText("Loading")).toBeNull()
  })

  it("shows a cached empty gallery immediately without flashing a skeleton", () => {
    vi.useFakeTimers()
    render(
      <PageDataCacheProvider>
        <SeedEmptyGalleryCache>
          <LayoutProvider>
            <DesktopNavigation />
            <NavigationPendingBoundary>
              <div>当前页面</div>
            </NavigationPendingBoundary>
          </LayoutProvider>
        </SeedEmptyGalleryCache>
      </PageDataCacheProvider>
    )
    act(() => {
      vi.advanceTimersByTime(0)
    })

    fireEvent.click(screen.getByRole("link", { name: "画廊" }))

    expect(screen.getByText("暂无图片")).toBeTruthy()
    expect(document.querySelector('[data-navigation-skeleton="gallery"]')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(document.querySelector('[data-navigation-skeleton="gallery"]')).toBeNull()
  })

  it("delays the tags skeleton while keeping its page header visible", () => {
    vi.useFakeTimers()
    renderWithLayout(
      <>
        <DesktopNavigation />
        <NavigationPendingBoundary>
          <div>当前页面</div>
        </NavigationPendingBoundary>
      </>
    )

    fireEvent.click(screen.getByRole("link", { name: "标签" }))

    expect(screen.getByText("JustMemo")).toBeTruthy()
    expect(document.querySelector('[data-navigation-skeleton="tags"]')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(document.querySelector('[data-navigation-skeleton="tags"]')).toBeTruthy()
  })

  it("shows a cached empty tags page immediately without flashing a skeleton", () => {
    vi.useFakeTimers()
    render(
      <PageDataCacheProvider>
        <SeedEmptyTagsCache>
          <LayoutProvider>
            <DesktopNavigation />
            <NavigationPendingBoundary>
              <div>当前页面</div>
            </NavigationPendingBoundary>
          </LayoutProvider>
        </SeedEmptyTagsCache>
      </PageDataCacheProvider>
    )
    act(() => {
      vi.advanceTimersByTime(0)
    })

    fireEvent.click(screen.getByRole("link", { name: "标签" }))

    expect(screen.getByText("暂无标签")).toBeTruthy()
    expect(document.querySelector('[data-navigation-skeleton="tags"]')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(document.querySelector('[data-navigation-skeleton="tags"]')).toBeNull()
  })

  it("shows the real home identity immediately before any home skeleton", () => {
    vi.useFakeTimers()
    mocks.pathname = "/gallery"
    render(
      <UIProvider currentPathname="/gallery">
        <LayoutProvider>
          <DesktopNavigation />
          <NavigationPendingBoundary>
            <div>当前页面</div>
          </NavigationPendingBoundary>
        </LayoutProvider>
      </UIProvider>
    )

    fireEvent.click(screen.getByRole("link", { name: "首页" }))

    expect(screen.getByRole("link", { name: "回到首页" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "更多选项" })).toBeTruthy()
    expect(document.querySelector('[data-navigation-skeleton="home"]')).toBeNull()
  })

  it("clears optimistic selection when navigation throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mocks.push.mockImplementationOnce(() => {
      throw new Error("navigation failed")
    })
    renderWithLayout(<DesktopNavigation />)

    const galleryLink = screen.getByRole("link", { name: "画廊" })
    fireEvent.click(galleryLink)

    expect(galleryLink.getAttribute("aria-current")).toBeNull()
    expect(screen.getByRole("link", { name: "首页" }).getAttribute("aria-current")).toBe("page")
    errorSpy.mockRestore()
  })

  it("does not keep a cancelled navigation selected forever", () => {
    vi.useFakeTimers()
    renderWithLayout(<DesktopNavigation />)

    const galleryLink = screen.getByRole("link", { name: "画廊" })
    fireEvent.click(galleryLink)
    expect(galleryLink.getAttribute("aria-current")).toBe("page")

    act(() => {
      vi.advanceTimersByTime(NAVIGATION_FEEDBACK_TIMEOUT_MS)
    })

    expect(galleryLink.getAttribute("aria-current")).toBeNull()
    expect(screen.getByRole("link", { name: "首页" }).getAttribute("aria-current")).toBe("page")
  })

  it("clears pending feedback when navigation is redirected", () => {
    const view = renderWithLayout(
      <>
        <DesktopNavigation />
        <NavigationPendingBoundary>
          <div data-testid="redirected-page">重定向页面</div>
        </NavigationPendingBoundary>
      </>
    )

    fireEvent.click(screen.getByRole("link", { name: "画廊" }))
    expect(document.querySelector('[data-gallery-loading-skeleton="hidden"]')).toBeTruthy()

    mocks.pathname = "/unauthorized"
    view.rerender(
      <LayoutProvider>
        <DesktopNavigation />
        <NavigationPendingBoundary>
          <div data-testid="redirected-page">重定向页面</div>
        </NavigationPendingBoundary>
      </LayoutProvider>
    )

    expect(screen.getByRole("link", { name: "画廊" }).getAttribute("aria-current")).toBeNull()
    expect(document.querySelector('[data-navigation-skeleton="gallery"]')).toBeNull()
    expect(screen.getByTestId("redirected-page")).toBeTruthy()
  })
})
