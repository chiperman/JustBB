"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, AnimatePresence, useDragControls, useReducedMotion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  Tag01Icon,
  Image01Icon as GalleryIcon,
  Location04Icon,
  Delete02Icon as TrashIcon,
  Menu01Icon as MenuIcon,
  Cancel01Icon,
  Sun01Icon as Sun,
  Moon01Icon as Moon,
  ComputerIcon as Monitor,
  Upload02Icon as Upload,
  Download02Icon as Download,
  FlashIcon,
  Logout02Icon as LogOut,
  Login03Icon as LogIn,
  ShieldCheck,
  UserIcon as User,
  UserCircleIcon as UserCircle,
} from "@hugeicons/core-free-icons"

import { cn } from "@/shared/lib/utils"
import { useUser } from "@/state/UserContext"
import { useLayout } from "@/state/LayoutContext"
import { Heatmap } from "@/shared/ui/Heatmap"
import { MOBILE_TAB_BAR_POSITION_CLASS } from "@/shared/layout/mobile-floating-layout"

import { UsageModal } from "@/features/admin/components/UsageModal"
import { ExportConfigDialog } from "./ExportConfigDialog"
import { ImportConfigDialog } from "./ImportConfigDialog"
import { R2ConfigDialog } from "@/features/settings/components/R2ConfigDialog"
import { supabase } from "@/lib/supabase"
import { logout } from "@/features/auth/actions"
import { DRAFT_CONTENT_KEY, DRAFT_IS_PRIVATE_KEY } from "@/features/memos/hooks/useMemoEditor"
import { useSidebarNavigation } from "@/shared/hooks/useSidebarNavigation"
import { useSidebarPagePrefetch } from "@/shared/hooks/useSidebarPagePrefetch"

export function MobileNavbar() {
  const router = useRouter()
  const { user, setUser } = useUser()
  const { setViewMode } = useLayout()
  const { theme, setTheme } = useTheme()

  const dragControls = useDragControls()
  const shouldReduceMotion = useReducedMotion()

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [usageModalOpen, setUsageModalOpen] = React.useState(false)
  const [r2ConfigOpen, setR2ConfigOpen] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const { currentView, handleNavigate, pendingNavigationPath } = useSidebarNavigation()
  const { prefetchPage } = useSidebarPagePrefetch()

  React.useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isDrawerOpen])

  const canUseImportExport = Boolean(user)
  const canUseUsageMonitor = user?.role === "admin"
  // 导航项定义
  const mainNavItems = React.useMemo(() => {
    return [
      { id: "home", label: "首页", href: "/", icon: Home01Icon },
      { id: "gallery", label: "画廊", href: "/gallery", icon: GalleryIcon },
      { id: "tags", label: "标签", href: "/tags", icon: Tag01Icon },
      { id: "map", label: "地图", href: "/map", icon: Location04Icon },
    ]
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    setUser(null)
    await supabase.auth.signOut()
    await logout()
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_CONTENT_KEY)
      localStorage.removeItem(DRAFT_IS_PRIVATE_KEY)
    }
    setLoggingOut(false)
    setIsDrawerOpen(false)
  }

  const renderIdentity = () => {
    if (user?.role === "admin")
      return <HugeiconsIcon icon={ShieldCheck} size={16} className="text-primary" />
    if (user) return <HugeiconsIcon icon={User} size={16} className="text-muted-foreground" />
    return <HugeiconsIcon icon={UserCircle} size={16} className="text-muted-foreground" />
  }

  const identityLabel = user ? user.email : "未登录"

  // 检查当前高亮的 Tab id
  const activeTabId = React.useMemo(() => {
    if (isDrawerOpen) return "more"
    const matched = mainNavItems.find((item) =>
      item.href === "/" ? currentView === "/" : currentView.startsWith(item.href)
    )
    return matched ? matched.id : null
  }, [currentView, isDrawerOpen, mainNavItems])

  const activeTabIndex = React.useMemo(() => {
    if (activeTabId === "more") return mainNavItems.length
    const index = mainNavItems.findIndex((item) => item.id === activeTabId)
    return index >= 0 ? index : 0
  }, [activeTabId, mainNavItems])

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-[72px] bg-gradient-to-t from-background/[0.62] to-transparent md:hidden"
      />
      {/* 底部悬浮导航胶囊 */}
      <div
        className={cn(
          "md:hidden fixed left-1/2 -translate-x-1/2 w-[80%] max-w-[390px] h-14 bg-background border border-border/60 rounded-full flex items-center justify-around px-2.5 py-1 z-[70] transition-all duration-300",
          MOBILE_TAB_BAR_POSITION_CLASS
        )}
      >
        {/* 只移动 x 轴，避免 Safari 视觉视口变化被共享布局动画误判为纵向位移。 */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ x: `${activeTabIndex * 100}%` }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }
          }
          className="pointer-events-none absolute inset-y-0.5 left-2.5 z-0 w-[calc((100%-1.25rem)/5)] rounded-full bg-primary/10"
        />
        {mainNavItems.map((item) => {
          const isActive = activeTabId === item.id
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={false}
              onPointerDown={() => {
                void prefetchPage(item.href)
              }}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                setIsDrawerOpen(false)
                handleNavigate(item.href, true)
              }}
              aria-current={isActive ? "page" : undefined}
              aria-busy={pendingNavigationPath === item.href || undefined}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 rounded-full outline-none transition-colors group cursor-pointer"
            >
              <span
                className={cn(
                  "relative z-10 flex flex-col items-center justify-center gap-0.5 transition-transform duration-200 active:scale-90",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <HugeiconsIcon icon={item.icon} size={20} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </span>
            </Link>
          )
        })}

        {/* 更多/菜单按钮 */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="relative flex flex-col items-center justify-center flex-1 h-full py-1 rounded-full outline-none transition-colors group cursor-pointer"
        >
          <span
            className={cn(
              "relative z-10 flex flex-col items-center justify-center gap-0.5 transition-transform duration-200 active:scale-90",
              isDrawerOpen ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <HugeiconsIcon icon={MenuIcon} size={20} />
            <span className="text-[10px] tracking-tight">更多</span>
          </span>
        </button>
      </div>

      {/* 底部滑出抽屉 */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-[80] bg-black/30 dark:bg-black/50 backdrop-blur-xs"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.95 }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 80 || info.velocity.y > 350) {
                  setIsDrawerOpen(false)
                }
              }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[90] max-h-[82vh] bg-background border-t border-border rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
              {/* Drag Handle Indicator */}
              <div
                className="flex-none flex items-center justify-center py-3.5 cursor-grab active:cursor-grabbing select-none touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
              </div>

              {/* Title & Close button */}
              <div className="flex-none px-6 pb-2 flex items-center justify-between border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-foreground">
                    更多设置与统计
                  </span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full bg-secondary hover:bg-accent text-muted-foreground transition-colors"
                  aria-label="关闭抽屉"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-6 custom-scrollbar">
                {/* 1. Statistics & Heatmap */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest pl-1">
                    数据统计
                  </h3>
                  <div
                    className="bg-muted/40 dark:bg-muted/15 border border-border/50 rounded-2xl p-4"
                    onTouchStart={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Heatmap
                      variant="mobile-menu"
                      onNavigate={() => setIsDrawerOpen(false)}
                      readOnly
                    />
                  </div>
                </div>

                {/* 2. Theme Preferences */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest pl-1">
                    外观主题
                  </h3>
                  <div className="flex p-1 bg-muted/60 dark:bg-muted/20 border border-border/30 rounded-xl w-full">
                    {[
                      { value: "light", label: "浅色", icon: Sun },
                      { value: "dark", label: "深色", icon: Moon },
                      { value: "system", label: "系统", icon: Monitor },
                    ].map((t) => {
                      const isSelected = theme === t.value
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTheme(t.value)}
                          className={cn(
                            "flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                            isSelected
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <HugeiconsIcon icon={t.icon} size={14} />
                          <span>{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Grid Actions / Tools */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest pl-1">
                    工具与菜单
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 导入笔记 */}
                    <button
                      onClick={() => {
                        setImportDialogOpen(true)
                      }}
                      disabled={!canUseImportExport}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-card/60 hover:bg-secondary active:scale-95 transition-all text-left text-xs font-medium text-foreground cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      )}
                    >
                      <HugeiconsIcon icon={Upload} size={16} className="text-primary" />
                      <span>导入 Memos</span>
                    </button>

                    {/* 导出笔记 */}
                    <button
                      onClick={() => {
                        setExportDialogOpen(true)
                      }}
                      disabled={!canUseImportExport}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-card/60 hover:bg-secondary active:scale-95 transition-all text-left text-xs font-medium text-foreground cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      )}
                    >
                      <HugeiconsIcon icon={Download} size={16} className="text-primary" />
                      <span>导出 Memos</span>
                    </button>

                    {/* 图片存储配置 */}
                    <button
                      onClick={() => {
                        setR2ConfigOpen(true)
                      }}
                      disabled={!canUseImportExport}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-card/60 hover:bg-secondary active:scale-95 transition-all text-left text-xs font-medium text-foreground cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      )}
                    >
                      <HugeiconsIcon icon={GalleryIcon} size={16} className="text-primary" />
                      <span>存储配置</span>
                    </button>

                    {/* 用量监控 (Admin) */}
                    {canUseUsageMonitor && (
                      <button
                        onClick={() => {
                          setUsageModalOpen(true)
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-card/60 hover:bg-secondary active:scale-95 transition-all text-left text-xs font-medium text-foreground cursor-pointer"
                        )}
                      >
                        <HugeiconsIcon
                          icon={FlashIcon}
                          size={16}
                          className="text-primary animate-pulse"
                        />
                        <span>服务用量</span>
                      </button>
                    )}

                    {/* 回收站 (仅登录可见) */}
                    {user && (
                      <button
                        onClick={() => {
                          setIsDrawerOpen(false)
                          router.push("/trash")
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-card/60 hover:bg-secondary active:scale-95 transition-all text-left text-xs font-medium text-foreground cursor-pointer"
                        )}
                      >
                        <HugeiconsIcon icon={TrashIcon} size={16} className="text-primary" />
                        <span>回收站</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. User Account Identity & Authentication */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-xl border border-border/40 bg-muted/65 dark:bg-muted/15"
                      )}
                    >
                      {renderIdentity()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate leading-none text-foreground">
                        {user ? (user.role === "admin" ? "管理员" : "普通用户") : "游客身份"}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate mt-1">
                        {identityLabel}
                      </span>
                    </div>
                  </div>

                  {!user ? (
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false)
                        setViewMode("SPLIT_VIEW")
                      }}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <HugeiconsIcon icon={LogIn} size={14} />
                      <span>登录</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="px-4 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/15 text-destructive text-xs font-medium transition-colors active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <HugeiconsIcon
                        icon={loggingOut ? Monitor : LogOut}
                        size={14}
                        className={cn(loggingOut && "animate-spin")}
                      />
                      <span>退出</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* dialogs */}
      <UsageModal open={usageModalOpen} onOpenChange={setUsageModalOpen} />
      <ExportConfigDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
      <ImportConfigDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <R2ConfigDialog open={r2ConfigOpen} onOpenChange={setR2ConfigOpen} />
    </>
  )
}
