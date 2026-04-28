"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Memo } from "@/types/memo"

export type ExportStatus =
  | "idle"
  | "exporting"
  | "paused"
  | "completed"
  | "error"
export type ExportFormat = "markdown" | "json"

interface ExportState {
  status: ExportStatus
  progress: number
  total: number
  format: ExportFormat
}

interface ExportContextType extends ExportState {
  startExport: (format: ExportFormat) => Promise<void>
  pauseExport: () => void
  resumeExport: () => void
  cancelExport: () => void
}

const ExportContext = React.createContext<ExportContextType | undefined>(
  undefined
)

const PAGE_SIZE = 100

export function ExportProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<ExportStatus>("idle")
  const [format, setFormat] = React.useState<ExportFormat>("markdown")
  const [progress, setProgress] = React.useState(0)
  const [total, setTotal] = React.useState(0)
  const { toast } = useToast()

  // 使用 refs 来管理在异步循环中需要实时访问的状态，避免闭包过时
  const statusRef = React.useRef<ExportStatus>("idle")
  const accumulatedDataRef = React.useRef<Memo[]>([])
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // 同步 ref 状态
  React.useEffect(() => {
    statusRef.current = status
  }, [status])

  const startExport = async (selectedFormat: ExportFormat) => {
    if (status !== "idle" && status !== "completed" && status !== "error")
      return

    setFormat(selectedFormat)
    setStatus("exporting")
    setProgress(0)
    accumulatedDataRef.current = []
    abortControllerRef.current = new AbortController()

    try {
      // 1. 获取总数
      const { count, error: countError } = await supabase
        .from("memos")
        .select("*", { count: "exact", head: true })

      if (countError) throw countError
      const totalCount = count || 0
      setTotal(totalCount)

      if (totalCount === 0) {
        setStatus("completed")
        toast({ title: "导出完成", description: "没有可导出的数据" })
        return
      }

      // 2. 开始分页抓取
      let currentOffset = 0
      while (currentOffset < totalCount) {
        // 检查是否取消
        if (statusRef.current === "idle") break

        // 检查是否暂停
        if (statusRef.current === "paused") {
          await new Promise((resolve) => setTimeout(resolve, 500))
          continue
        }

        const { data, error } = await supabase
          .from("memos")
          .select("*")
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + PAGE_SIZE - 1)
          .abortSignal(abortControllerRef.current?.signal)

        if (error) throw error

        if (data) {
          accumulatedDataRef.current.push(...(data as unknown as Memo[]))
          currentOffset += data.length
          setProgress(accumulatedDataRef.current.length)
        }

        // 给主线程一点喘息时间
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (statusRef.current === "exporting" || statusRef.current === "paused") {
        await processAndDownload(selectedFormat)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // 用户取消，无需处理
      } else {
        const errorMessage = err instanceof Error ? err.message : "未知错误"
        console.error("Export failed:", err)
        setStatus("error")
        toast({
          title: "导出失败",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const processAndDownload = async (currentFormat: ExportFormat) => {
    setStatus("completed")
    const data = accumulatedDataRef.current
    const timestamp = new Date().toISOString().split("T")[0]
    let blob: Blob
    let filename: string

    if (currentFormat === "json") {
      const content = JSON.stringify(data, null, 2)
      blob = new Blob([content], { type: "application/json" })
      filename = `memos-backup-${timestamp}.json`
    } else {
      // Markdown 转换逻辑
      const content = data
        .map((memo: Memo) => {
          // eslint-disable-next-line no-restricted-syntax
          const date = new Date(memo.created_at as string).toLocaleString() // hydration-safe
          const visibility = memo.is_private ? "🔒 私密" : "🌍 公开"
          return `### [${date}] ${visibility}\n\n${memo.content}\n\n---\n`
        })
        .join("\n")
      blob = new Blob([content], { type: "text/markdown" })
      filename = `memos-backup-${timestamp}.md`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({ title: "导出成功", description: `备份文件 ${filename} 已下载` })

    // 3秒后自动恢复到空闲状态
    setTimeout(() => setStatus("idle"), 3000)
  }

  const pauseExport = () => setStatus("paused")
  const resumeExport = () => setStatus("exporting")
  const cancelExport = () => {
    abortControllerRef.current?.abort()
    setStatus("idle")
    setProgress(0)
    accumulatedDataRef.current = []
  }

  return (
    <ExportContext.Provider
      value={{
        status,
        progress,
        total,
        format,
        startExport,
        pauseExport,
        resumeExport,
        cancelExport,
      }}
    >
      {children}
    </ExportContext.Provider>
  )
}

export function useExport() {
  const context = React.useContext(ExportContext)
  if (context === undefined) {
    throw new Error("useExport must be used within an ExportProvider")
  }
  return context
}
