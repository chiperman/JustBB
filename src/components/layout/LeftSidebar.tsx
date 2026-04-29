"use client"

import { Suspense, useEffect, useSyncExternalStore } from "react"
import { TagCloud } from "../ui/TagCloud"
import { Heatmap } from "../ui/Heatmap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SidebarSettings } from "./SidebarSettings"
import { motion } from "framer-motion"

import { useSidebarNavigation } from "@/hooks/useSidebarNavigation"
import { SidebarNavItem } from "./sidebar/SidebarNavItem"
import { useHasMounted } from "@/hooks/useHasMounted"
import {
  LEFT_SIDEBAR_COOKIE_KEY,
  LEFT_SIDEBAR_STORAGE_EVENT,
  LEFT_SIDEBAR_STORAGE_KEY,
  getStoredLayoutPreference,
  persistLayoutPreference,
  subscribeToLayoutPreference,
  syncLayoutPreferenceCookie,
} from "@/lib/layout-preferences"

export interface LeftSidebarProps {
  onClose?: () => void
  initialCollapsed?: boolean
}

const SIDEBAR_EXPANDED_WIDTH = 280
const SIDEBAR_COLLAPSED_WIDTH = 88
const SIDEBAR_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
}
const CONTENT_FADE_TRANSITION = {
  duration: 0.14,
  ease: [0.4, 0, 0.2, 1] as const,
}
const HEATMAP_SLOT_HEIGHT = 248
const TAGS_SLOT_HEIGHT = 176

export function LeftSidebar({
  onClose,
  initialCollapsed = false,
}: LeftSidebarProps) {
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

  useEffect(() => {
    syncLayoutPreferenceCookie(
      LEFT_SIDEBAR_STORAGE_KEY,
      LEFT_SIDEBAR_COOKIE_KEY
    )
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
        width: effectiveIsCollapsed
          ? SIDEBAR_COLLAPSED_WIDTH
          : SIDEBAR_EXPANDED_WIDTH,
      }}
      transition={SIDEBAR_TRANSITION}
      style={{ willChange: "width" }}
      className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-muted p-2"
    >
      {/* Top Area */}
      <div className="flex h-16 shrink-0 items-center justify-between px-3">
        <div
          className={cn(
            "h-9 overflow-hidden",
            effectiveIsCollapsed ? "w-9 min-w-9 shrink-0" : "flex-1 min-w-0"
          )}
        >
          <SidebarSettings isCollapsed={effectiveIsCollapsed} />
        </div>
        {!effectiveIsCollapsed && (
          <Button
            variant="ghost"
            onClick={toggleCollapsedState}
            aria-label={
              isMobile
                ? "关闭侧边栏"
                : effectiveIsCollapsed
                  ? "展开侧边栏"
                  : "收起侧边栏"
            }
            className="h-9 w-9 shrink-0 rounded-md border-none px-0 text-muted-foreground transition-all duration-200 hover:bg-secondary/80"
          >
            <span className="flex items-center justify-center">
              {isMobile ? (
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              ) : effectiveIsCollapsed ? (
                <HugeiconsIcon icon={PanelLeftCloseIcon} size={16} />
              ) : (
                <HugeiconsIcon icon={PanelLeftOpenIcon} size={16} />
              )}
            </span>
          </Button>
        )}
      </div>

      {/* Heatmap Area */}
      <motion.div
        initial={false}
        className={cn(
          "shrink-0 overflow-hidden px-1",
          effectiveIsCollapsed ? "mb-0" : "mb-5"
        )}
        animate={{ height: effectiveIsCollapsed ? 0 : HEATMAP_SLOT_HEIGHT }}
        transition={SIDEBAR_TRANSITION}
      >
        <motion.div
          initial={false}
          className="h-full"
          animate={{ opacity: effectiveIsCollapsed ? 0 : 1 }}
          transition={
            effectiveIsCollapsed
              ? CONTENT_FADE_TRANSITION
              : {
                  ...CONTENT_FADE_TRANSITION,
                  delay: 0.14,
                }
          }
        >
          <Suspense
            fallback={
              <div className="h-40 w-full animate-pulse rounded bg-muted/20" />
            }
          >
            <Heatmap />
          </Suspense>
        </motion.div>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        layout
        transition={SIDEBAR_TRANSITION}
        className={cn(
          "relative min-h-0 flex-1 overflow-x-hidden px-1 pb-4 custom-scrollbar",
          effectiveIsCollapsed ? "overflow-y-hidden" : "overflow-y-auto"
        )}
      >
        <motion.div
          layout
          transition={SIDEBAR_TRANSITION}
          className={cn(
            "mb-3 border-t border-border",
            effectiveIsCollapsed ? "mx-1" : "mx-2"
          )}
        />

        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={
              hasMounted &&
              (item.href === "/"
                ? currentView === "/"
                : currentView.startsWith(item.href))
            }
            isCollapsed={effectiveIsCollapsed}
            onClick={(href) => handleNavigate(href, isMobile, onClose)}
          />
        ))}
      </motion.nav>

      {/* Popular Tags */}
      <motion.div
        initial={false}
        className="mt-auto shrink-0 overflow-hidden"
        animate={{
          height: effectiveIsCollapsed ? 0 : TAGS_SLOT_HEIGHT,
          opacity: effectiveIsCollapsed ? 0 : 1,
        }}
        transition={{
          height: SIDEBAR_TRANSITION,
          opacity: effectiveIsCollapsed
            ? CONTENT_FADE_TRANSITION
            : { ...CONTENT_FADE_TRANSITION, delay: 0.14 },
        }}
      >
        <div className="h-full border-t border-border px-1 pt-4 pb-1">
          <h3 className="mb-4 flex items-center gap-2 card-title">热门标签</h3>
          <Suspense
            fallback={
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-6 w-12 rounded-full bg-muted/20 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            }
          >
            <TagCloud />
          </Suspense>
        </div>
      </motion.div>
    </motion.aside>
  )
}
