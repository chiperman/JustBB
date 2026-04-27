"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Database01Icon,
  FlashIcon,
  ApiIcon,
  UserGroupIcon,
  CheckListIcon,
  ReloadIcon,
  Cancel01Icon as CloseIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UsageProgress } from "./UsageProgress"
import {
  getSupabaseUsageStats,
  type SupabaseUsageResult,
} from "@/actions/usage"
import { motion, AnimatePresence } from "framer-motion"
import { DialogClose } from "@/components/ui/dialog"
import { useHasMounted } from "@/hooks/useHasMounted"

interface UsageModalProps {
  trigger: React.ReactNode
}

interface HintProps {
  label: string
  tip: string
  muted?: boolean
}

interface MetricCardProps {
  label: string
  value: number | string
  hint: string
  footnote: string
  accent?: "green" | "orange" | "blue"
  muted?: boolean
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
const EMPTY_USAGE_DATA: NonNullable<SupabaseUsageResult["data"]> =
  EMPTY_USAGE_STATS.data!

function InfoHint({ label, tip, muted = false }: HintProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
          muted
            ? "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
            : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
        )}
        aria-label={`${label} 指标说明`}
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 w-52 -translate-x-1/2 whitespace-normal break-words rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-medium leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {tip}
      </span>
    </span>
  )
}

function MetricCard({
  label,
  value,
  hint,
  footnote,
  accent = "green",
  muted = false,
}: MetricCardProps) {
  const accentClass = muted
    ? "bg-gray-300"
    : accent === "orange"
      ? "bg-orange-400"
      : accent === "blue"
        ? "bg-sky-500"
        : "bg-emerald-500"

  return (
    <div className="rounded-card border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-gray-400">
        <span className={cn("h-1.5 w-1.5 rounded-full", accentClass)} />
        <span>{label}</span>
        <InfoHint label={label} tip={hint} muted={muted} />
      </div>
      <div
        className={cn(
          "text-lg font-bold tabular-nums",
          muted ? "text-gray-400" : "text-gray-800"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-gray-400">{footnote}</div>
    </div>
  )
}

export function UsageModal({ trigger }: UsageModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState<SupabaseUsageResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const hasMounted = useHasMounted()
  const displayStats = stats ?? EMPTY_USAGE_STATS
  const displayData: NonNullable<SupabaseUsageResult["data"]> =
    stats?.data ?? EMPTY_USAGE_DATA
  const isPlaceholder = !stats
  const showStatusBanner = loading || !!error
  const showManagementApiBanner =
    !isPlaceholder && displayStats.sourceMode === "fallback"
  const managementApiMessage = !displayStats.managementApiConfigured
    ? "未配置 Supabase Management API。要获取完整 Free Plan 数据，请配置 SUPABASE_PROJECT_REF 和 SUPABASE_MANAGEMENT_API_KEY。"
    : "Supabase Management API 当前不可用，正在使用基础回退数据。"

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    // 保证加载动画至少显示 800ms，提升视觉体感
    const startTime = Date.now()
    const MIN_LOADING_TIME = 800

    try {
      const result = await getSupabaseUsageStats()

      const elapsedTime = Date.now() - startTime
      if (elapsedTime < MIN_LOADING_TIME) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_LOADING_TIME - elapsedTime)
        )
      }

      if (result.success && result.data) {
        setStats(result)
      } else {
        setError(result.error || "获取数据失败")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (isOpen && !stats) {
      fetchData()
    }
  }, [isOpen, stats, fetchData])

  if (!hasMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md overflow-x-hidden bg-white border-none p-0 overflow-y-hidden shadow-2xl [&>button]:hidden">
        <div className="flex flex-col h-full bg-[#fcfcfc]">
          <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <HugeiconsIcon
                  icon={FlashIcon}
                  size={20}
                  className="text-primary"
                />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-800 tracking-tight">
                Supabase 用量
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  void fetchData()
                }}
                className="h-7 w-7 rounded-md text-gray-400 hover:text-primary hover:bg-accent transition-all active:scale-95 shadow-none"
                disabled={loading}
              >
                <HugeiconsIcon
                  icon={ReloadIcon}
                  size={14}
                  className={cn(loading && "animate-spin")}
                />
              </Button>
            </div>

            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
              >
                <HugeiconsIcon icon={CloseIcon} size={16} />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="custom-scrollbar flex max-h-[70vh] min-h-[356px] flex-col overflow-y-auto overflow-x-hidden px-6 pt-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {showStatusBanner && (
                  <div
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-card border px-4 py-3",
                      error
                        ? "border-red-100 bg-red-50/80"
                        : "border-orange-100/50 bg-orange-50/50"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          "mt-0.5 rounded-md p-1.5",
                          error
                            ? "bg-red-100 text-red-500"
                            : "bg-orange-100 text-orange-500"
                        )}
                      >
                        <HugeiconsIcon
                          icon={error ? ApiIcon : ReloadIcon}
                          size={14}
                          className={cn(!error && "animate-spin")}
                        />
                      </div>
                      <div className="space-y-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            error ? "text-red-600" : "text-gray-600"
                          )}
                        >
                          {error ?? "正在同步云端配额..."}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {error
                            ? "已保留当前卡片结构，可手动重试。"
                            : "数据返回后会直接填充到下方图表。"}
                        </p>
                      </div>
                    </div>
                    {error && (
                      <Button
                        onClick={() => void fetchData()}
                        variant="outline"
                        size="sm"
                        className="rounded-md active:scale-95 shadow-sm"
                      >
                        重试
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between bg-orange-50/40 p-4 rounded-card border border-orange-100/50">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        displayStats.isFullIndicator
                          ? "bg-green-500"
                          : "bg-orange-400"
                      )}
                    />
                    <span className="text-sm font-medium text-gray-600">
                      数据源模式
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700 shadow-none">
                      Free Plan
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border shadow-none",
                        displayStats.isFullIndicator
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-[#FFF4E5] text-[#D97706] border-[#FDBA74]/30"
                      )}
                    >
                      {displayStats.isFullIndicator
                        ? "Management API"
                        : "Fallback"}
                    </span>
                  </div>
                </div>

                <div className="rounded-card border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <span>状态说明</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-300" />
                      等待数据
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      正常 / 全量
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                      监控中 / 基础模式
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      接近上限 / 错误
                    </span>
                  </div>
                </div>

                {showManagementApiBanner && (
                  <div className="rounded-card border border-orange-100 bg-orange-50/70 px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-orange-700">
                          需要 Supabase Management API
                        </p>
                        <p className="text-[11px] leading-relaxed text-orange-600">
                          {managementApiMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={cn("space-y-6", loading && !stats && "opacity-70")}
                >
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                      <HugeiconsIcon icon={Database01Icon} size={14} />
                      <span>存储与数据库</span>
                    </div>
                    <div className="grid gap-2">
                      <UsageProgress
                        label="数据库大小"
                        used={displayData.db.used}
                        limit={displayData.db.limit}
                        percentage={displayData.db.percentage}
                        unit="MB"
                        muted={isPlaceholder}
                        info="Supabase Postgres 数据库当前占用空间，接近上限时会影响免费额度与后续写入余量。"
                      />
                      <UsageProgress
                        label="对象存储"
                        used={displayData.storage.used}
                        limit={displayData.storage.limit}
                        percentage={displayData.storage.percentage}
                        unit="MB"
                        muted={isPlaceholder}
                        info="Supabase Storage 文件占用空间，图片、附件和导出文件都会消耗这里的额度。"
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                      <HugeiconsIcon icon={UserGroupIcon} size={14} />
                      <span>访问与流量</span>
                    </div>
                    <div className="grid gap-2">
                      <UsageProgress
                        label="月活用户 (MAU)"
                        used={displayData.mau.used}
                        limit={displayData.mau.limit}
                        percentage={displayData.mau.percentage}
                        muted={isPlaceholder}
                        info="当前计费周期内活跃过的独立用户数，用来衡量免费档用户规模是否快到上限。"
                      />
                      <UsageProgress
                        label="网络流出 (Egress)"
                        used={displayData.egress.used}
                        limit={displayData.egress.limit}
                        percentage={displayData.egress.percentage}
                        unit="GB"
                        muted={isPlaceholder}
                        info="从 Supabase 向外传输的数据流量，接口响应、文件下载和图片访问都会消耗它。"
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                      <HugeiconsIcon icon={FlashIcon} size={14} />
                      <span>高级指标</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard
                        label="Realtime 连接"
                        value={displayData.realtime.connections}
                        footnote="峰值连接数"
                        hint="Realtime 服务的并发连接峰值，适合判断是否有太多客户端同时保持实时订阅。"
                        accent="blue"
                        muted={isPlaceholder}
                      />
                      <MetricCard
                        label="Realtime 消息"
                        value={displayData.realtime.messages}
                        footnote="累计消息数"
                        hint="Realtime 通道累计发送的消息量，适合排查实时功能是否过于频繁。"
                        accent="blue"
                        muted={isPlaceholder}
                      />
                      <MetricCard
                        label="Edge Functions"
                        value={displayData.functions.invocations}
                        footnote="调用次数"
                        hint="Supabase Edge Functions 的调用总次数，适合观察服务端中转和自动化逻辑的消耗。"
                        accent="green"
                        muted={isPlaceholder}
                      />
                      <div className="rounded-card border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-gray-400">
                          <HugeiconsIcon
                            icon={CheckListIcon}
                            size={12}
                            className={cn(isPlaceholder && "text-gray-300")}
                          />
                          <span>数据完整性</span>
                          <InfoHint
                            label="数据完整性"
                            tip="全量表示来自 Supabase Management API；基础表示部分指标为回退值或估算值。"
                            muted={isPlaceholder}
                          />
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-2 text-sm font-bold",
                            isPlaceholder
                              ? "text-gray-400"
                              : displayStats.isFullIndicator
                                ? "text-green-600"
                                : "text-orange-500"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isPlaceholder
                                ? "bg-gray-300"
                                : displayStats.isFullIndicator
                                  ? "bg-green-500"
                                  : "bg-orange-400"
                            )}
                          />
                          {displayStats.isFullIndicator ? "全量" : "基础"}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-[11px]",
                            isPlaceholder ? "text-gray-400" : "text-gray-400"
                          )}
                        >
                          {displayStats.isFullIndicator
                            ? "来自 Management API"
                            : "部分指标为回退值"}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-6 py-5 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2.5 text-[11px] text-gray-400 leading-relaxed font-medium">
              <div className="bg-gray-100 p-1 rounded-md">
                <HugeiconsIcon
                  icon={ApiIcon}
                  size={10}
                  className="text-gray-400"
                />
              </div>
              <p>
                数据{loading ? "更新中..." : "每分钟同步一次"}。配额基于
                Supabase 免费层级 (Free Plan) 标准。
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
