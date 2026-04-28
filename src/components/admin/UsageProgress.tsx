"use client"

import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UsageProgressProps {
  label: string
  used: number
  limit: number | string
  percentage: number
  unit?: string
  info?: string
  muted?: boolean
  className?: string
}

export function UsageProgress({
  label,
  used,
  limit,
  percentage,
  unit = "",
  info,
  muted = false,
  className,
}: UsageProgressProps) {
  // 根据百分比确定颜色
  const getColorClass = (pct: number) => {
    if (muted) return "bg-muted-foreground/30 shadow-none"
    if (pct >= 90) return "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.3)]"
    if (pct >= 70) return "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
    return "bg-primary shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.2)]"
  }

  const getBgColorClass = (pct: number) => {
    if (pct >= 90) return "bg-destructive/10"
    if (pct >= 70) return "bg-amber-500/10"
    return "bg-primary/5"
  }

  const statusText = muted
    ? "等待数据"
    : percentage >= 90
      ? "接近上限"
      : percentage >= 70
        ? "监控中"
        : "正常"
  const statusDotClass = muted
    ? "bg-muted-foreground/40"
    : percentage >= 90
      ? "bg-destructive"
      : percentage >= 70
        ? "bg-amber-500"
        : "bg-emerald-500"
  const statusTextClass = muted
    ? "text-muted-foreground/60"
    : percentage >= 90
      ? "text-destructive"
      : percentage >= 70
        ? "text-amber-500"
        : "text-muted-foreground"

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex justify-between items-end">
        <div className="space-y-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-2 text-[13px] font-medium transition-colors",
              muted ? "text-muted-foreground/50" : "text-foreground/80"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all duration-500",
                statusDotClass
              )}
            />
            <span>{label}</span>
            {info && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 shrink-0 aspect-square items-center justify-center rounded-full text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all outline-none"
                  >
                    <HugeiconsIcon icon={InformationCircleIcon} size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs rounded-xl border-border/40 bg-popover/95 px-3 py-2 text-[11px] font-medium leading-relaxed backdrop-blur-md shadow-2xl">
                  <p>{info}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </span>
        </div>
        <div className="text-right leading-none">
          <span
            className={cn(
              "text-[13px] font-semibold tabular-nums",
              muted ? "text-muted-foreground/50" : "text-foreground"
            )}
          >
            {used}
            {unit}
          </span>
          <span className="ml-1 text-[11px] text-muted-foreground/50 italic">
            / {limit}
            {unit}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "h-1.5 w-full rounded-full overflow-hidden relative border border-white/5 dark:border-white/5 shadow-inner transition-colors duration-500",
          getBgColorClass(percentage)
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-in-out",
            getColorClass(percentage)
          )}
          style={{ width: `${muted ? 12 : percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center px-0.5">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider transition-colors duration-500",
            statusTextClass
          )}
        >
          {statusText}
        </span>
        <span
          className={cn(
            "text-[11px] font-mono font-medium",
            muted ? "text-muted-foreground/40" : "text-muted-foreground/60"
          )}
        >
          {percentage}%
        </span>
      </div>
    </div>
  )
}
