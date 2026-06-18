"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Timeline,
  TimelineContent,
  TimelineLine,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
} from "@/shared/ui/timeline"
import { DailyTimeline } from "./DailyTimeline"
import { Skeleton } from "@/shared/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { useLayout } from "@/state/LayoutContext"
import { TimelineStats } from "@/types/stats"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { cn } from "@/shared/lib/utils"
import { getTimelineStats } from "@/server/actions/memos/analytics"
import { SidebarCollapseButton } from "./SidebarCollapseButton"
import { shouldRefreshMemoDerivedData, useMemoSync } from "@/lib/memos/events"
import {
  RIGHT_SIDEBAR_COOKIE_KEY,
  RIGHT_SIDEBAR_STORAGE_EVENT,
  RIGHT_SIDEBAR_STORAGE_KEY,
  getStoredLayoutPreference,
  persistLayoutPreference,
  subscribeToLayoutPreference,
  syncLayoutPreferenceCookie,
} from "@/shared/lib/layout-preferences"

const RIGHT_SIDEBAR_EXPANDED_WIDTH = 320

export function RightSidebar({
  initialCollapsed = false,
  initialData,
}: {
  initialCollapsed?: boolean
  initialData?: TimelineStats
}) {
  const [allDays, setAllDays] = useState<Record<string, { count: number }>>(initialData?.days || {})
  const isMounted = useHasMounted()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { animationMultiplier } = useLayout()

  const rightSidebarTransition = useMemo(
    () => ({
      duration: 0.28 * animationMultiplier,
      ease: [0.22, 1, 0.36, 1] as const,
    }),
    [animationMultiplier]
  )
  const isCollapsed = useSyncExternalStore(
    (onStoreChange) =>
      subscribeToLayoutPreference(
        RIGHT_SIDEBAR_STORAGE_KEY,
        RIGHT_SIDEBAR_STORAGE_EVENT,
        onStoreChange
      ),
    () => getStoredLayoutPreference(RIGHT_SIDEBAR_STORAGE_KEY),
    () => initialCollapsed
  )

  // Only display on homepage
  const isHomePage = pathname === "/"

  // 读取 URL 筛选参数
  const dateFilter = searchParams.get("date")
  const yearFilter = searchParams.get("year")
  const monthFilter = searchParams.get("month")

  const { activeId, setActiveId, setManualClick } = useLayout()

  const refreshTimelineStats = useCallback(async () => {
    const res = await getTimelineStats()
    if (res.success && res.data) {
      setAllDays(res.data.days)
    }
  }, [])

  const setCollapsedState = (nextCollapsed: boolean) => {
    persistLayoutPreference(
      RIGHT_SIDEBAR_STORAGE_KEY,
      RIGHT_SIDEBAR_COOKIE_KEY,
      RIGHT_SIDEBAR_STORAGE_EVENT,
      nextCollapsed
    )
  }

  useEffect(() => {
    syncLayoutPreferenceCookie(RIGHT_SIDEBAR_STORAGE_KEY, RIGHT_SIDEBAR_COOKIE_KEY)
  }, [])

  // 自动滚动侧边栏以确保选中项可见
  useEffect(() => {
    if (isMounted && activeId) {
      const element = document.getElementById(`nav-${activeId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [activeId, isMounted])

  // 当 URL 参数变化时（热力图筛选），同步本地高亮状态
  useEffect(() => {
    if (!isMounted) return
    if (dateFilter) {
      setActiveId(`date-${dateFilter}`)
    } else if (yearFilter && monthFilter) {
      setActiveId(`month-${yearFilter}-${monthFilter}`)
    } else if (yearFilter) {
      setActiveId(`year-${yearFilter}`)
    }
  }, [dateFilter, yearFilter, monthFilter, setActiveId, isMounted])

  // 挂载后异步拉取时间轴数据 (如果服务端未提供)
  useEffect(() => {
    if (Object.keys(allDays).length === 0) {
      getTimelineStats().then((res) => {
        if (res.success && res.data) {
          setAllDays(res.data.days)
        }
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useMemoSync(
    useCallback(
      (payload) => {
        if (shouldRefreshMemoDerivedData(payload)) {
          void refreshTimelineStats()
        }
      },
      [refreshTimelineStats]
    )
  )

  // 构建时间轴数据结构（始终基于全量数据）
  const fullTimeline = useMemo(() => {
    const structure = new Map<number, Map<number, Set<number>>>()

    Object.keys(allDays).forEach((dateStr) => {
      const parts = dateStr.split("-")
      if (parts.length < 3) return

      const year = parseInt(parts[0])
      const month = parseInt(parts[1])
      const day = parseInt(parts[2])

      if (isNaN(year) || isNaN(month) || isNaN(day)) return

      if (!structure.has(year)) {
        structure.set(year, new Map())
      }
      const yearMap = structure.get(year)!

      if (!yearMap.has(month)) {
        yearMap.set(month, new Set())
      }
      yearMap.get(month)?.add(day)
    })

    return Array.from(structure.keys())
      .sort((a, b) => b - a)
      .map((year) => {
        const yearMap = structure.get(year)!
        const months = Array.from(yearMap.keys())
          .sort((a, b) => b - a)
          .map((month) => ({
            month,
            days: Array.from(yearMap.get(month)!).sort((a, b) => b - a),
          }))
        return { year, months }
      })
  }, [allDays])

  // 计算高亮状态 - 增加 isMounted 守卫以解决 Hydration Mismatch
  const isYearActive = (year: number) => {
    if (!isMounted) return false // 服务端始终返回 false
    const id = `year-${year}`
    if (activeId === id) return true
    if (!activeId && yearFilter === String(year) && !monthFilter && !dateFilter) return true
    return false
  }

  const isMonthActive = (year: number, month: number) => {
    if (!isMounted) return false
    const id = `month-${year}-${month}`
    if (activeId === id) return true
    if (!activeId && yearFilter === String(year) && monthFilter === String(month) && !dateFilter)
      return true
    return false
  }

  const isDayActive = (dateStr: string) => {
    if (!isMounted) return false
    const id = `date-${dateStr}`
    if (activeId === id) return true
    if (!activeId && dateFilter === dateStr) return true
    return false
  }

  const monthNames = [
    "",
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ]

  const handleYearClick = (e: React.MouseEvent, year: number) => {
    e.preventDefault()
    const id = `year-${year}`
    setManualClick(true)
    setActiveId(id)

    // Instead of teleporting silently, we push state to URL to enable caching
    // setTeleportDate({ date: `${year}-01-01`, type: "year" });
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.delete("date")
    currentParams.delete("month")
    currentParams.set("year", String(year))
    router.push(`/?${currentParams.toString()}`)
  }

  const handleMonthClick = (e: React.MouseEvent, year: number, month: number) => {
    e.preventDefault()
    const id = `month-${year}-${month}`
    setManualClick(true)
    setActiveId(id)

    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.delete("date")
    currentParams.set("year", String(year))
    currentParams.set("month", String(month))
    router.push(`/?${currentParams.toString()}`)
  }

  const handleDayClick = (e: React.MouseEvent, dateStr: string) => {
    e.preventDefault()
    const id = `date-${dateStr}`
    setManualClick(true)
    setActiveId(id)

    const currentParams = new URLSearchParams(searchParams.toString())

    currentParams.delete("year")
    currentParams.delete("month")
    currentParams.set("date", dateStr)
    router.push(`/?${currentParams.toString()}`)
  }

  if (!isHomePage) return null

  // 客户端挂载前的静态骨架屏占位，用于 SSR 与水合首帧，防止 Layout Shift 并彻底杜绝动画初始化竞态
  if (!isMounted) {
    return (
      <div className="relative hidden xl:block h-full shrink-0 overflow-visible">
        <div
          style={{
            willChange: "width",
            width: initialCollapsed ? 0 : RIGHT_SIDEBAR_EXPANDED_WIDTH,
          }}
          className="relative h-full overflow-hidden"
        >
          <aside className="flex h-full w-80 flex-col overflow-hidden border-l border-border bg-muted p-6">
            <div className="mb-8 flex h-9 items-center justify-between">
              <h3 className="badge-text uppercase">时间轴</h3>
              <div className="w-9 shrink-0" />
            </div>
            <div className="relative flex-1 overflow-y-auto pr-1 scrollbar-hide">
              <div className="space-y-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative">
                    <TimelineLine className="bg-(--heatmap-0)" />
                    <TimelineDot className="border-(--heatmap-0) bg-(--heatmap-0)" />
                    <Skeleton className={cn("mb-6 h-4", i % 2 === 0 ? "w-16" : "w-12")} />
                    <div className="space-y-6 pl-4">
                      <div className="space-y-3">
                        <Skeleton className={cn("h-3", i % 2 === 0 ? "w-12" : "w-14")} />
                        <div className="space-y-2">
                          <Skeleton className="h-2 w-10" />
                          <Skeleton className="h-2 w-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
        <div className="absolute top-6 right-6 z-30">
          <SidebarCollapseButton
            isCollapsed={initialCollapsed}
            onClick={() => {}}
            side="right"
            label={initialCollapsed ? "展开右侧时间轴" : "收起右侧时间轴"}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative hidden xl:block h-full shrink-0 overflow-visible">
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 0 : RIGHT_SIDEBAR_EXPANDED_WIDTH }}
        transition={rightSidebarTransition}
        style={{
          willChange: "width",
          width: isCollapsed ? 0 : RIGHT_SIDEBAR_EXPANDED_WIDTH,
        }}
        className="relative h-full overflow-hidden"
      >
        <aside className="flex h-full w-80 flex-col overflow-hidden border-l border-border bg-muted p-6">
          <div className="mb-8 flex h-9 items-center justify-between">
            <h3 className="badge-text uppercase">时间轴</h3>
            <div className="w-9 shrink-0" />
          </div>
          <div className="relative flex-1 overflow-y-auto pr-1 scrollbar-hide">
            <AnimatePresence mode="wait">
              {Object.keys(allDays).length === 0 ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-8"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="relative">
                      <TimelineLine className="bg-(--heatmap-0)" />
                      <TimelineDot className="border-(--heatmap-0) bg-(--heatmap-0)" />
                      <Skeleton className={cn("mb-6 h-4", i % 2 === 0 ? "w-16" : "w-12")} />
                      <div className="space-y-6 pl-4">
                        <div className="space-y-3">
                          <Skeleton className={cn("h-3", i % 2 === 0 ? "w-12" : "w-14")} />
                          <div className="space-y-2">
                            <Skeleton className="h-2 w-10" />
                            <Skeleton className="h-2 w-8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : dateFilter ? (
                <DailyTimeline key="daily" date={dateFilter} />
              ) : (
                <motion.div
                  key="main-timeline"
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="flex h-full flex-col"
                >
                  <Timeline>
                    {Object.keys(allDays).length > 0 ? (
                      fullTimeline.map((yearGroup) => (
                        <TimelineItem
                          key={yearGroup.year}
                          className="overflow-visible pb-8"
                          id={`nav-year-${yearGroup.year}`}
                        >
                          <TimelineLine active={false} />
                          <TimelineDot
                            className={cn(
                              "top-1.5 transition-all duration-300",
                              isYearActive(yearGroup.year)
                                ? "scale-110 border-primary bg-primary ring-primary/20"
                                : "border-border bg-background"
                            )}
                          />
                          <TimelineHeading className="mb-6">
                            <button
                              className={cn(
                                "font-mono text-sm font-bold tracking-tighter transition-colors",
                                isYearActive(yearGroup.year)
                                  ? "text-primary"
                                  : "text-foreground hover:text-primary"
                              )}
                              onClick={(e) => handleYearClick(e, yearGroup.year)}
                            >
                              {yearGroup.year}
                            </button>
                          </TimelineHeading>
                          <TimelineContent>
                            {yearGroup.months.map((monthGroup) => (
                              <div
                                key={monthGroup.month}
                                className="relative mb-6 last:mb-0"
                                id={`nav-month-${yearGroup.year}-${monthGroup.month}`}
                              >
                                <div className="relative mb-3">
                                  <TimelineLine
                                    active={isMonthActive(yearGroup.year, monthGroup.month)}
                                    className={cn(
                                      "-left-[25px] transition-opacity duration-300",
                                      !isMonthActive(yearGroup.year, monthGroup.month) &&
                                        "opacity-0"
                                    )}
                                  />
                                  <h5
                                    className={cn(
                                      "block pl-1 text-[11px] font-bold tracking-wide uppercase transition-colors",
                                      isMonthActive(yearGroup.year, monthGroup.month)
                                        ? "text-primary"
                                        : "text-muted-foreground/80 hover:text-primary"
                                    )}
                                  >
                                    <button
                                      className="block w-full text-left"
                                      onClick={(e) =>
                                        handleMonthClick(e, yearGroup.year, monthGroup.month)
                                      }
                                    >
                                      {monthNames[monthGroup.month]}
                                    </button>
                                  </h5>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  {monthGroup.days.map((day) => {
                                    const dateStr = `${yearGroup.year}-${String(monthGroup.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                                    const isActive = isDayActive(dateStr)

                                    return (
                                      <div
                                        key={day}
                                        className="relative"
                                        id={`nav-date-${dateStr}`}
                                      >
                                        <TimelineLine
                                          active={isActive}
                                          className={cn(
                                            "-left-[25px] transition-opacity duration-300",
                                            !isActive && "opacity-0"
                                          )}
                                        />
                                        <button
                                          type="button"
                                          className={cn(
                                            "block w-full py-0.5 pl-1 text-left font-mono text-[10px] font-bold tracking-tight transition-colors",
                                            isActive
                                              ? "text-primary"
                                              : "text-muted-foreground/50 hover:text-primary/70"
                                          )}
                                          onClick={(e) => handleDayClick(e, dateStr)}
                                        >
                                          {`${day}号`}
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </TimelineContent>
                        </TimelineItem>
                      ))
                    ) : (
                      <div className="py-4 font-mono text-xs text-muted-foreground/50">
                        暂无记录
                      </div>
                    )}
                  </Timeline>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </motion.div>

      {/* 唯一的折叠按钮：固定在右上角位置不动，避免错位 */}
      <div className="absolute top-6 right-6 z-30">
        <SidebarCollapseButton
          isCollapsed={isCollapsed}
          onClick={() => setCollapsedState(!isCollapsed)}
          side="right"
          label={isCollapsed ? "展开右侧时间轴" : "收起右侧时间轴"}
        />
      </div>
    </div>
  )
}
