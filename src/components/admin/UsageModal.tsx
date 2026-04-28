"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Database01Icon,
  FlashIcon,
  ApiIcon,
  UserGroupIcon,
  CheckListIcon,
  ReloadIcon,
  InformationCircleIcon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UsageProgress } from "./UsageProgress"
import {
  getSupabaseUsageStats,
  type SupabaseUsageResult,
} from "@/actions/usage"
import { motion, AnimatePresence } from "framer-motion"
import { useHasMounted } from "@/hooks/useHasMounted"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AdminDialogShell } from "@/components/ui/AdminDialogShell"

interface UsageModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const EMPTY_USAGE_STATS: SupabaseUsageResult = {
  success: false,
  error: null,
  isFullIndicator: false,
  sourceMode: "fallback",
  managementApiConfigured: false,
  data: {
    db: { used: 0, limit: 500, percentage: 0, unit: "MB" },
    storage: { used: 0, limit: 1024, percentage: 0, unit: "MB" },
    mau: { used: 0, limit: 50000, percentage: 0, unit: "" },
    egress: { used: 0, limit: 5, percentage: 0, unit: "GB" },
    realtime: { connections: 0, messages: 0 },
    functions: { invocations: 0 },
  },
}

function InfoHint({
  label,
  tip,
  muted = false,
}: {
  label: string
  tip: string
  muted?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-4 w-4 shrink-0 aspect-square items-center justify-center rounded-full transition-all outline-none",
            muted
              ? "text-[#6b6964]/30"
              : "text-[#6b6964]/50 hover:text-[#d97757] hover:bg-[#d97757]/10"
          )}
          aria-label={`${label} 指标说明`}
        >
          <HugeiconsIcon icon={InformationCircleIcon} size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-52 rounded-xl border border-[#1d1d1b]/10 bg-white dark:bg-[#1a1a18] px-3 py-2 text-[11px] font-medium leading-relaxed shadow-xl">
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function MetricCard({
  label,
  value,
  hint,
  footnote,
  accent = "green",
  muted = false,
}: {
  label: string
  value: number | string
  hint: string
  footnote: string
  accent?: "green" | "orange" | "blue"
  muted?: boolean
}) {
  const accentClass = muted
    ? "bg-[#6b6964]/30"
    : accent === "orange"
      ? "bg-[#d97757]"
      : accent === "blue"
        ? "bg-[#af8fef]"
        : "bg-[#1aae39]"

  return (
    <div className="group rounded-2xl border border-[#1d1d1b]/5 dark:border-white/5 bg-[#f6f5f4] dark:bg-white/[0.02] p-4 transition-all duration-300 hover:bg-[#efefef] dark:hover:bg-white/[0.04] shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#6b6964]">
          <span className={cn("h-1.5 w-1.5 rounded-full", accentClass)} />
          <span className="truncate">{label}</span>
        </div>
        <InfoHint label={label} tip={hint} muted={muted} />
      </div>
      <div
        className={cn(
          "text-xl font-bold tabular-nums tracking-tight text-[#1d1d1b] dark:text-white/90",
          muted ? "opacity-30" : "opacity-100"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] text-[#6b6964] font-medium truncate">
        {footnote}
      </div>
    </div>
  )
}

export function UsageModal({
  open: controlledOpen,
  onOpenChange,
}: UsageModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen =
    isControlled && onOpenChange ? onOpenChange : setInternalOpen

  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState<SupabaseUsageResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const hasMounted = useHasMounted()

  const displayStats = stats ?? EMPTY_USAGE_STATS
  const displayData = stats?.data ?? EMPTY_USAGE_STATS.data!
  const isPlaceholder = !stats

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    const startTime = Date.now()
    try {
      const result = await getSupabaseUsageStats()
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 800)
        await new Promise((r) => setTimeout(r, 800 - elapsedTime))
      if (result.success) setStats(result)
      else setError(result.error || "获取失败")
    } catch {
      setError("网络错误")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (isOpen && !stats) fetchData()
  }, [isOpen, stats, fetchData])

  if (!hasMounted) return null

  return (
    <AdminDialogShell
      open={isOpen}
      onOpenChange={setIsOpen}
      title="服务用量监控"
      subtitle="实时同步 Supabase 云端资源配额"
      icon={FlashIcon}
      maxWidth="max-w-[720px]"
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchData}
          className="h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90"
          disabled={loading}
        >
          <HugeiconsIcon
            icon={ReloadIcon}
            size={15}
            className={cn(loading && "animate-spin")}
          />
        </Button>
      }
      footer={
        <div className="flex items-center gap-2.5 text-[#6b6964] font-medium tracking-tight">
          <HugeiconsIcon icon={ApiIcon} size={12} />
          <p>数据每分钟同步一次。配额基于 Supabase Free 档标准。</p>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#d97757]/20 bg-[#d97757]/[0.03] px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl p-1.5 bg-[#d97757]/10 text-[#d97757] shadow-sm">
                <HugeiconsIcon icon={ApiIcon} size={14} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#d97757]">{error}</p>
                <p className="text-[11px] text-[#d97757]/60 leading-normal font-medium">
                  服务同步遇到问题，请检查网络或稍后重试。
                </p>
              </div>
            </div>
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="rounded-xl border-[#d97757]/20 hover:bg-[#d97757]/5 text-[#d97757] h-8 px-3"
            >
              重试
            </Button>
          </div>
        )}

        {/* 状态卡片 */}
        <div className="flex flex-col bg-[#f9f7f2] dark:bg-white/[0.01] rounded-2xl border border-[#1d1d1b]/5 dark:border-white/5 shadow-inner overflow-hidden transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(26,174,57,0.3)]",
                  displayStats.isFullIndicator ? "bg-[#1aae39]" : "bg-[#d97757]"
                )}
              />
              <span className="text-[13px] font-bold text-[#1d1d1b] dark:text-white/80 tracking-tight">
                数据源状态
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-[#d97757]/10 bg-[#d97757]/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d97757]">
                Free Plan
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm",
                  displayStats.isFullIndicator
                    ? "bg-green-500/10 text-[#1aae39] border-[#1aae39]/10"
                    : "bg-[#d97757]/10 text-[#d97757] border-[#d97757]/10"
                )}
              >
                {displayStats.isFullIndicator ? "Full Sync" : "Basic Mode"}
              </span>
            </div>
          </div>
          <AnimatePresence>
            {!isPlaceholder && displayStats.sourceMode === "fallback" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="px-4 py-2.5 bg-[#d97757]/5 border-t border-[#1d1d1b]/5 dark:border-white/5 flex items-center gap-2 text-[#d97757]/80">
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    size={12}
                    className="shrink-0"
                  />
                  <p className="text-[11px] font-semibold leading-none tracking-tight">
                    {!displayStats.managementApiConfigured
                      ? "未配置 Management API，正在使用回退数据。"
                      : "Management API 当前不可用，已切换至回退模式。"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 核心资源 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#6b6964] uppercase tracking-[0.2em] pl-1">
              <HugeiconsIcon icon={Database01Icon} size={12} />
              <span>存储与数据库</span>
            </div>
            <div className="grid gap-6 bg-[#f6f5f4] dark:bg-white/[0.01] rounded-2xl p-5 border border-[#1d1d1b]/5 dark:border-white/5 h-full shadow-inner">
              <UsageProgress
                label="数据库存储"
                used={displayData.db.used}
                limit={displayData.db.limit}
                percentage={displayData.db.percentage}
                unit="MB"
                muted={isPlaceholder}
                info="Supabase Postgres 数据库当前占用空间。"
              />
              <div className="h-px bg-[#1d1d1b]/5 dark:bg-white/5" />
              <UsageProgress
                label="对象存储"
                used={displayData.storage.used}
                limit={displayData.storage.limit}
                percentage={displayData.storage.percentage}
                unit="MB"
                muted={isPlaceholder}
                info="Supabase Storage 文件占用空间。"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#6b6964] uppercase tracking-[0.2em] pl-1">
              <HugeiconsIcon icon={UserGroupIcon} size={12} />
              <span>访问与流量</span>
            </div>
            <div className="grid gap-6 bg-[#f6f5f4] dark:bg-white/[0.01] rounded-2xl p-5 border border-[#1d1d1b]/5 dark:border-white/5 h-full shadow-inner">
              <UsageProgress
                label="月活用户 (MAU)"
                used={displayData.mau.used}
                limit={displayData.mau.limit}
                percentage={displayData.mau.percentage}
                muted={isPlaceholder}
                info="当前计费周期内活跃过的独立用户数。"
              />
              <div className="h-px bg-[#1d1d1b]/5 dark:bg-white/5" />
              <UsageProgress
                label="网络流出 (Egress)"
                used={displayData.egress.used}
                limit={displayData.egress.limit}
                percentage={displayData.egress.percentage}
                unit="GB"
                muted={isPlaceholder}
                info="从服务器向外传输的数据流量。"
              />
            </div>
          </section>
        </div>

        {/* 其它指标 */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#6b6964] uppercase tracking-[0.2em] pl-1">
            <HugeiconsIcon icon={FlashIcon} size={12} />
            <span>实时与性能指标</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Realtime 连接"
              value={displayData.realtime.connections}
              footnote="并发峰值"
              hint="实时订阅服务的并发连接峰值。"
              accent="blue"
              muted={isPlaceholder}
            />
            <MetricCard
              label="Realtime 消息"
              value={displayData.realtime.messages}
              footnote="累计消息"
              hint="Realtime 通道累计发送的消息量。"
              accent="blue"
              muted={isPlaceholder}
            />
            <MetricCard
              label="Edge Functions"
              value={displayData.functions.invocations}
              footnote="调用总数"
              hint="边缘函数的调用统计。"
              accent="green"
              muted={isPlaceholder}
            />
            <div className="group rounded-2xl border border-[#1d1d1b]/5 dark:border-white/5 bg-[#f6f5f4] dark:bg-white/[0.01] p-3.5 transition-all duration-300 hover:bg-[#efefef] dark:hover:bg-white/[0.04] shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#6b6964]">
                  <HugeiconsIcon
                    icon={CheckListIcon}
                    size={12}
                    className={cn(isPlaceholder && "opacity-30")}
                  />
                  <span className="truncate">完整性</span>
                </div>
                <InfoHint
                  label="数据完整性"
                  tip="全量表示来自 API；基础表示部分指标为估算值。"
                  muted={isPlaceholder}
                />
              </div>
              <div
                className={cn(
                  "text-lg font-bold tracking-tight flex items-center gap-1.5 text-[#1d1d1b] dark:text-white/90",
                  isPlaceholder && "opacity-30"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isPlaceholder
                      ? "bg-[#6b6964]/30"
                      : displayStats.isFullIndicator
                        ? "bg-[#1aae39]"
                        : "bg-[#d97757]"
                  )}
                />
                {displayStats.isFullIndicator ? "全量" : "基础"}
              </div>
              <div className="mt-0.5 text-[10px] text-[#6b6964] font-medium truncate tracking-tight">
                {displayStats.isFullIndicator ? "API Sync" : "Basic Mode"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminDialogShell>
  )
}
