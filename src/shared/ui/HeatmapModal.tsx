"use client"

import { useState, useMemo, useCallback, memo } from "react"
import {
  format,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getYear,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns"
import { Calendar02Icon as CalendarIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { AdminDialogShell } from "@/shared/ui/AdminDialogShell"

import { YearlyStats } from "./YearlyStats"

interface DayStats {
  count: number
  wordCount: number
}

interface HeatmapStats {
  totalMemos: number
  totalTags: number
  firstMemoDate: string | null
  days: Record<string, DayStats>
}

interface HeatmapModalProps {
  stats: HeatmapStats
  trigger: React.ReactNode
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    } as const,
  },
}

const dialogLayoutTransition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.8,
} as const

const viewTransition = {
  opacity: { duration: 0.16 },
  y: { duration: 0.2, ease: [0.33, 1, 0.68, 1] },
} as const

type HoveredDay = {
  date: string
  count: number
  wordCount: number
  left: number
  top: number
  align: "left" | "center" | "right"
}

function getColorClass(count: number) {
  if (count === 0) return "bg-(--heatmap-0)"
  if (count <= 2) return "bg-(--heatmap-1)"
  if (count <= 5) return "bg-(--heatmap-2)"
  if (count <= 9) return "bg-(--heatmap-3)"
  return "bg-(--heatmap-4)"
}

export function HeatmapModal({ stats, trigger }: HeatmapModalProps) {
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"month" | "year">("month")
  const [hoveredDay, setHoveredDay] = useState<HoveredDay | null>(null)

  // Calculate available years from stats
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    if (!stats.firstMemoDate) return [currentYear]
    const parts = stats.firstMemoDate.split("-")
    const startYear = parseInt(parts[0])
    const years = []
    for (let y = currentYear; y >= startYear; y--) {
      years.push(y)
    }
    return years
  }, [stats.firstMemoDate])

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const currentYear = new Date().getFullYear()
    return String(currentYear)
  })

  const visibleMonths = useMemo(() => {
    const targetYear = Number(selectedYear)
    const now = new Date()
    const isCurrentYear = targetYear === now.getFullYear()

    return eachMonthOfInterval({
      start: startOfMonth(new Date(targetYear, 0, 1)),
      end: isCurrentYear ? startOfMonth(now) : endOfMonth(new Date(targetYear, 11, 1)),
    }).reverse()
  }, [selectedYear])

  const clearHoveredDay = useCallback(() => {
    setHoveredDay(null)
  }, [])

  const handleHover = useCallback(
    (e: React.MouseEvent, date: string, count: number, wordCount: number) => {
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const container = target.closest(".heatmap-modal-tooltip-wrapper") as HTMLElement

      if (container) {
        const containerRect = container.getBoundingClientRect()
        const relX = rect.left - containerRect.left + rect.width / 2
        const containerWidth = containerRect.width

        let align: "left" | "center" | "right" = "center"
        if (relX < 72) align = "left"
        else if (relX > containerWidth - 72) align = "right"

        setHoveredDay({
          date,
          count,
          wordCount,
          left: relX,
          top: rect.top - containerRect.top,
          align,
        })
      }
    },
    []
  )

  const handleViewModeChange = useCallback(
    (nextViewMode: "month" | "year") => {
      clearHoveredDay()
      setViewMode(nextViewMode)
    },
    [clearHoveredDay]
  )

  const handleSelectedYearChange = useCallback(
    (year: string) => {
      clearHoveredDay()
      setSelectedYear(year)
    },
    [clearHoveredDay]
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-md text-left outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {trigger}
      </button>

      <AdminDialogShell
        open={open}
        onOpenChange={setOpen}
        title="记录统计"
        subtitle="按月份与年份查看记录节奏"
        icon={CalendarIcon}
        maxWidth="max-w-[1100px]"
        contentClassName="px-8 py-7 max-h-[78vh]"
        animateLayout
        layoutTransition={dialogLayoutTransition}
        headerActions={
          <div className="flex items-center rounded-md bg-secondary/80 p-0.5 whisper-border pointer-events-auto relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange("month")}
              className={cn(
                "relative z-10 px-3.5 text-xs h-7 rounded-[6px] transition-colors hover:bg-transparent",
                viewMode === "month"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              {viewMode === "month" && (
                <motion.div
                  layoutId="heatmap-modal-active-tab"
                  className="absolute inset-0 bg-card rounded-[6px] shadow-[0_1px_2px_rgba(29,29,27,0.05)] whisper-border"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                />
              )}
              <span className="relative z-10">月</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange("year")}
              className={cn(
                "relative z-10 px-3.5 text-xs h-7 rounded-[6px] transition-colors hover:bg-transparent",
                viewMode === "year"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              {viewMode === "year" && (
                <motion.div
                  layoutId="heatmap-modal-active-tab"
                  className="absolute inset-0 bg-card rounded-[6px] shadow-[0_1px_2px_rgba(29,29,27,0.05)] whisper-border"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                />
              )}
              <span className="relative z-10">年</span>
            </Button>
          </div>
        }
      >
        <div
          className="relative flex flex-col gap-6 heatmap-modal-wrapper"
          onMouseLeave={clearHoveredDay}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {viewMode === "month" ? (
              <motion.div
                key="month-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={viewTransition}
                className="relative flex flex-col gap-6 overflow-visible heatmap-modal-tooltip-wrapper"
              >
                <div className="flex flex-col gap-4 rounded-2xl border border-[#1d1d1b]/8 bg-[#f6f5f4]/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d97757]">
                      浏览范围
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#6b6964]">
                      按月份查看每日记录密度与字数分布
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a39e98]">
                      年份
                    </span>
                    <Select value={selectedYear} onValueChange={handleSelectedYearChange}>
                      <SelectTrigger
                        variant="ghost"
                        className="h-9 min-w-[104px] rounded-md border border-[#1d1d1b]/8 bg-white px-3 text-sm font-semibold text-[#1d1d1b] hover:bg-white data-[state=open]:bg-white"
                      >
                        <SelectValue placeholder="年份" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        side="bottom"
                        align="end"
                        sideOffset={6}
                        className="min-w-[104px]"
                      >
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}年
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <motion.div
                  key={selectedYear}
                  className="grid grid-cols-1 gap-5 pb-6 lg:grid-cols-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {visibleMonths.map((month) => (
                    <motion.div key={month.toISOString()} variants={itemVariants}>
                      <MonthCalendar
                        date={month}
                        stats={stats.days}
                        colorFn={getColorClass}
                        onHover={handleHover}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {hoveredDay && (
                  <div
                    className={cn(
                      "absolute z-[999] mt-[-8px] rounded-md border border-[#1d1d1b]/10 bg-white/96 px-3 py-2 text-[11px] text-[#1d1d1b] backdrop-blur-md pointer-events-none animate-in fade-in zoom-in duration-100 whitespace-nowrap shadow-[0_12px_30px_rgba(29,29,27,0.08)]",
                      hoveredDay.align === "center" && "-translate-x-1/2 -translate-y-full",
                      hoveredDay.align === "left" && "-translate-y-full",
                      hoveredDay.align === "right" && "-translate-x-full -translate-y-full"
                    )}
                    style={{ left: hoveredDay.left, top: hoveredDay.top }}
                  >
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="font-bold text-[#d97757]">{hoveredDay.count} 笔记</span>
                      <span className="opacity-30">/</span>
                      <span className="font-medium text-[#6b6964]">{hoveredDay.wordCount} 字</span>
                    </div>
                    <div className="mt-1 text-[10px] font-medium text-[#a39e98] tabular-nums">
                      {hoveredDay.date}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="year-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={viewTransition}
                className="rounded-2xl border border-[#1d1d1b]/8 bg-[#f6f5f4]/45 p-5"
              >
                <YearlyStats stats={stats.days} firstMemoDate={stats.firstMemoDate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AdminDialogShell>
    </>
  )
}

const MonthCalendar = memo(function MonthCalendar({
  date,
  stats,
  colorFn,
  onHover,
}: {
  date: Date
  stats: Record<string, DayStats>
  colorFn: (c: number) => string
  onHover: (e: React.MouseEvent, date: string, count: number, wordCount: number) => void
}) {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const monthStats = useMemo(() => {
    let count = 0
    let daysWithMemos = 0
    eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((d) => {
      const dayStat = stats[format(d, "yyyy-MM-dd")]
      if (dayStat) {
        count += dayStat.count
        if (dayStat.count > 0) daysWithMemos++
      }
    })
    return { count, daysWithMemos }
  }, [stats, monthStart, monthEnd])

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-[#1d1d1b]/8 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[22px] font-bold tracking-tight text-[#1d1d1b]">
          {getYear(date) !== new Date().getFullYear()
            ? format(date, "yyyy年 M月")
            : format(date, "M月")}
        </h3>
        <div className="flex gap-3 text-[11px] font-semibold text-[#a39e98]">
          <span className="tabular-nums">{monthStats.count} 笔记</span>
          <span className="tabular-nums">{monthStats.daysWithMemos} 记录天数</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
          <span key={d} className="pb-1 text-[10px] font-semibold text-[#a39e98]">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const dayStat = stats[dateStr]
          const count = dayStat?.count || 0
          const isCurrentMonth = isSameMonth(day, monthStart)

          return (
            <motion.div
              key={dateStr}
              className="relative group/day aspect-square flex items-center justify-center cursor-default"
              whileHover={isCurrentMonth && count > 0 ? { scale: 1.04, y: -1 } : {}}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
              onMouseEnter={(e) =>
                isCurrentMonth && count > 0 && onHover(e, dateStr, count, dayStat?.wordCount || 0)
              }
            >
              <div
                className={cn(
                  "h-full w-full rounded-xl border border-transparent transition-colors duration-150",
                  !isCurrentMonth
                    ? "opacity-0 pointer-events-none"
                    : cn(
                        colorFn(count),
                        count === 0 ? "bg-[#f1f2f4] text-[#a39e98]" : "border-black/0"
                      )
                )}
              />
              {isCurrentMonth && (
                <span
                  className={cn(
                    "pointer-events-none absolute text-[11px] font-semibold tabular-nums",
                    count > 5 ? "text-white/95" : "text-[#6b6964]"
                  )}
                >
                  {format(day, "d")}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
})
