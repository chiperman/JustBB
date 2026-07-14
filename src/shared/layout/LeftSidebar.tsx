"use client"

import { Suspense, useEffect, useSyncExternalStore } from "react"
import { Heatmap } from "../ui/Heatmap"
import { cn } from "@/shared/lib/utils"
import { SidebarCollapseButton } from "./SidebarCollapseButton"
import { BrandLogo } from "../ui/BrandLogo"
import { SidebarSettings } from "./SidebarSettings"
import { motion } from "framer-motion"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"

import { useSidebarNavigation } from "@/shared/hooks/useSidebarNavigation"
import { useSidebarPagePrefetch } from "@/shared/hooks/useSidebarPagePrefetch"
import { SidebarNavItem } from "./sidebar/SidebarNavItem"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
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
const SIDEBAR_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
}
const HEATMAP_SLOT_HEIGHT = 248

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
        width: isMobile
          ? "100%"
          : effectiveIsCollapsed
            ? SIDEBAR_COLLAPSED_WIDTH
            : SIDEBAR_EXPANDED_WIDTH,
      }}
      transition={SIDEBAR_TRANSITION}
      style={{ willChange: "width" }}
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-muted p-2",
        isMobile &&
          "min-h-full border-r-0 bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:border-r sm:bg-muted sm:p-2"
      )}
    >
      {/* Top Area: 包含折叠按钮与品牌Logo */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center pl-1 gap-2.5",
          isMobile &&
            "order-0 h-14 w-full border-b border-border/60 px-0 pb-4 pl-0 sm:h-16 sm:border-b-0 sm:pb-0 sm:pl-1"
        )}
      >
        <SidebarCollapseButton
          isCollapsed={effectiveIsCollapsed}
          onClick={toggleCollapsedState}
          side="left"
          isMobile={isMobile}
          label={isMobile ? "关闭侧边栏" : effectiveIsCollapsed ? "展开侧边栏" : "收起侧边栏"}
          className={
            isMobile
              ? "rounded-full border border-border/40 bg-background/40 sm:border-0 sm:bg-transparent"
              : undefined
          }
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => handleNavigate("/", isMobile, onClose)}
              disabled={effectiveIsCollapsed}
              initial={false}
              animate={{
                opacity: effectiveIsCollapsed ? 0 : 1,
                width: effectiveIsCollapsed ? 0 : 92,
                x: effectiveIsCollapsed ? -10 : 0,
                display: effectiveIsCollapsed ? "none" : "flex",
              }}
              transition={SIDEBAR_TRANSITION}
              className={cn(
                "flex h-9 items-center overflow-hidden whitespace-nowrap select-none cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md px-1 -ml-1 bg-transparent text-left border-none",
                effectiveIsCollapsed && "pointer-events-none"
              )}
              aria-label="返回首页"
            >
              <BrandLogo className="text-foreground/80 hover:text-foreground transition-colors duration-200 shrink-0" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">返回首页</TooltipContent>
        </Tooltip>
      </div>

      {/* Heatmap Area */}
      <motion.div
        initial={false}
        className={cn(
          "shrink-0 overflow-hidden px-1",
          isMobile &&
            "order-2 mt-5 rounded-2xl border border-border/60 bg-muted/45 px-3 py-3 !h-[220px] sm:order-none sm:mt-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-1 sm:py-0 sm:!h-[248px]"
        )}
        animate={{
          height: isMobile ? 220 : effectiveIsCollapsed ? 0 : HEATMAP_SLOT_HEIGHT,
          marginBottom: isMobile || effectiveIsCollapsed ? 0 : 20,
        }}
        transition={SIDEBAR_TRANSITION}
      >
        <motion.div
          initial={false}
          className={cn("h-full w-[264px] shrink-0", isMobile && "w-full max-w-none sm:w-[264px]")}
          animate={{ opacity: effectiveIsCollapsed ? 0 : 1 }}
          transition={SIDEBAR_TRANSITION}
        >
          <Suspense fallback={<div className="h-40 w-full animate-pulse rounded bg-muted/20" />}>
            {isMobile ? (
              <>
                <div className="sm:hidden">
                  <div className="h-[194px] overflow-hidden">
                    <Heatmap variant="mobile-menu" onNavigate={onClose} readOnly />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <Heatmap onNavigate={onClose} />
                </div>
              </>
            ) : (
              <Heatmap />
            )}
          </Suspense>
        </motion.div>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        transition={SIDEBAR_TRANSITION}
        className={cn(
          "relative min-h-0 flex-1 overflow-x-hidden px-1 pb-4 custom-scrollbar",
          isMobile &&
            "order-1 mt-6 w-full flex-none overflow-visible px-0 pb-0 sm:order-none sm:mt-0 sm:max-w-none sm:px-1 sm:pb-4",
          effectiveIsCollapsed ? "overflow-y-hidden" : "overflow-y-auto"
        )}
      >
        <motion.div
          transition={SIDEBAR_TRANSITION}
          className={cn(
            "mb-3 border-t border-border",
            isMobile && "hidden sm:block",
            effectiveIsCollapsed ? "mx-1" : "mx-2"
          )}
        />

        {isMobile && (
          <p className="mb-2 px-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:hidden">
            Navigation / 导航
          </p>
        )}

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
            isMobile={isMobile}
          />
        ))}
      </motion.nav>

      {/* Bottom Settings Area: 设置按钮移至此处，带 mt-auto 置底 */}
      <div
        className={cn(
          "shrink-0 border-t border-border mt-auto pt-2 flex items-center pl-1 w-full",
          isMobile &&
            "order-3 mt-5 rounded-2xl border border-border/60 bg-muted/45 p-2 pl-2 sm:order-none sm:mx-0 sm:max-w-none sm:rounded-none sm:border-t sm:border-x-0 sm:border-b-0 sm:bg-transparent sm:pt-2 sm:pl-1"
        )}
      >
        <SidebarSettings isCollapsed={effectiveIsCollapsed} />
      </div>
    </motion.aside>
  )
}
