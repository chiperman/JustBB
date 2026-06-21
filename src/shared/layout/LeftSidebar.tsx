"use client"

import { Suspense, useEffect, useSyncExternalStore } from "react"
import { TagCloud } from "../ui/TagCloud"
import { Heatmap } from "../ui/Heatmap"
import { cn } from "@/shared/lib/utils"
import { SidebarCollapseButton } from "./SidebarCollapseButton"
import { BrandLogo } from "../ui/BrandLogo"
import { SidebarSettings } from "./SidebarSettings"
import { motion } from "framer-motion"

import { useSidebarNavigation } from "@/shared/hooks/useSidebarNavigation"
import { useSidebarPagePrefetch } from "@/shared/hooks/useSidebarPagePrefetch"
import { SidebarNavItem } from "./sidebar/SidebarNavItem"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { useLayout } from "@/state/LayoutContext"
import {
  LEFT_SIDEBAR_COOKIE_KEY,
  LEFT_SIDEBAR_STORAGE_EVENT,
  LEFT_SIDEBAR_STORAGE_KEY,
  getStoredLayoutPreference,
  persistLayoutPreference,
  subscribeToLayoutPreference,
  syncLayoutPreferenceCookie,
} from "@/shared/lib/layout-preferences"

export interface LeftSidebarProps {
  onClose?: () => void
  initialCollapsed?: boolean
}

const SIDEBAR_EXPANDED_WIDTH = 280
const SIDEBAR_COLLAPSED_WIDTH = 60
const HEATMAP_SLOT_HEIGHT = 248
const TAGS_SLOT_HEIGHT = "auto"

export function LeftSidebar({ onClose, initialCollapsed = false }: LeftSidebarProps) {
  const isMobile = !!onClose
  const isCollapsed = useSyncExternalStore(
    (onStoreChange) =>
      subscribeToLayoutPreference(
        LEFT_SIDEBAR_STORAGE_KEY,
        LEFT_SIDEBAR_STORAGE_EVENT,
        onStoreChange
      ),
    () => getStoredLayoutPreference(LEFT_SIDEBAR_STORAGE_KEY),
    () => initialCollapsed
  )
  const effectiveIsCollapsed = isMobile ? false : isCollapsed
  const hasMounted = useHasMounted()

  const { navItems, currentView, handleNavigate } = useSidebarNavigation()
  const { schedulePrefetch, cancelPrefetch } = useSidebarPagePrefetch()
  const { animationMultiplier } = useLayout()

  const sidebarTransition = {
    duration: 0.28 * animationMultiplier,
    ease: [0.22, 1, 0.36, 1] as const,
  }
  const contentFadeTransition = {
    duration: 0.14 * animationMultiplier,
    ease: [0.4, 0, 0.2, 1] as const,
  }

  useEffect(() => {
    syncLayoutPreferenceCookie(LEFT_SIDEBAR_STORAGE_KEY, LEFT_SIDEBAR_COOKIE_KEY)
  }, [])

  const toggleCollapsedState = () => {
    if (isMobile) {
      onClose?.()
      return
    }

    const nextCollapsed = !isCollapsed
    persistLayoutPreference(
      LEFT_SIDEBAR_STORAGE_KEY,
      LEFT_SIDEBAR_COOKIE_KEY,
      LEFT_SIDEBAR_STORAGE_EVENT,
      nextCollapsed
    )
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: effectiveIsCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
      }}
      transition={sidebarTransition}
      style={{ willChange: "width" }}
      className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-muted p-2"
    >
      {/* Top Area: 包含折叠按钮与品牌Logo */}
      <div className="flex h-16 shrink-0 items-center pl-1 gap-2.5">
        <SidebarCollapseButton
          isCollapsed={effectiveIsCollapsed}
          onClick={toggleCollapsedState}
          side="left"
          isMobile={isMobile}
          label={isMobile ? "关闭侧边栏" : effectiveIsCollapsed ? "展开侧边栏" : "收起侧边栏"}
        />
        <motion.button
          onClick={() => handleNavigate("/", isMobile, onClose)}
          disabled={effectiveIsCollapsed}
          initial={false}
          animate={{
            opacity: effectiveIsCollapsed ? 0 : 1,
            width: effectiveIsCollapsed ? 0 : 149,
            x: effectiveIsCollapsed ? -10 : 0,
            display: effectiveIsCollapsed ? "none" : "flex",
          }}
          transition={sidebarTransition}
          className={cn(
            "overflow-hidden whitespace-nowrap flex items-center select-none cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md p-1 -ml-1 bg-transparent text-left border-none",
            effectiveIsCollapsed && "pointer-events-none"
          )}
          title="返回首页"
          aria-label="返回首页"
        >
          <BrandLogo className="text-foreground/80 hover:text-foreground transition-colors duration-200 shrink-0" />
        </motion.button>
      </div>

      {/* Heatmap Area */}
      <motion.div
        initial={false}
        className="shrink-0 overflow-hidden px-1"
        animate={{
          height: effectiveIsCollapsed ? 0 : HEATMAP_SLOT_HEIGHT,
          marginBottom: effectiveIsCollapsed ? 0 : 20,
        }}
        transition={sidebarTransition}
      >
        <motion.div
          initial={false}
          className="h-full w-[264px] shrink-0"
          animate={{ opacity: effectiveIsCollapsed ? 0 : 1 }}
          transition={sidebarTransition}
        >
          <Suspense fallback={<div className="h-40 w-full animate-pulse rounded bg-muted/20" />}>
            <Heatmap />
          </Suspense>
        </motion.div>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        layout
        transition={sidebarTransition}
        className={cn(
          "relative min-h-0 flex-1 overflow-x-hidden px-1 pb-4 custom-scrollbar",
          effectiveIsCollapsed ? "overflow-y-hidden" : "overflow-y-auto"
        )}
      >
        <motion.div
          layout
          transition={sidebarTransition}
          className={cn("mb-3 border-t border-border", effectiveIsCollapsed ? "mx-1" : "mx-2")}
        />

        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={
              hasMounted &&
              (item.href === "/" ? currentView === "/" : currentView.startsWith(item.href))
            }
            isCollapsed={effectiveIsCollapsed}
            onClick={(href) => handleNavigate(href, isMobile, onClose)}
            onMouseEnter={schedulePrefetch}
            onMouseLeave={cancelPrefetch}
          />
        ))}
      </motion.nav>

      {/* Popular Tags */}
      <motion.div
        initial={false}
        className="shrink-0 overflow-hidden"
        animate={{
          height: effectiveIsCollapsed ? 0 : TAGS_SLOT_HEIGHT,
          opacity: effectiveIsCollapsed ? 0 : 1,
        }}
        transition={{
          height: sidebarTransition,
          opacity: sidebarTransition,
        }}
      >
        <div className="w-[264px] shrink-0 border-t border-border px-1 pt-4 pb-4">
          <h3 className="mb-4 flex items-center gap-2 card-title">热门标签</h3>
          <Suspense
            fallback={
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-6 w-12 rounded-md bg-muted/20 animate-pulse" />
                  ))}
                </div>
              </div>
            }
          >
            <TagCloud />
          </Suspense>
        </div>
      </motion.div>

      {/* Bottom Settings Area: 设置按钮移至此处，带 mt-auto 置底 */}
      <div className="shrink-0 border-t border-border mt-auto pt-2 flex items-center pl-1 w-full">
        <SidebarSettings isCollapsed={effectiveIsCollapsed} />
      </div>
    </motion.aside>
  )
}
