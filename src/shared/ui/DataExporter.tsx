"use client"

import { useState } from "react"
import { exportMemos } from "@/server/actions/memos/analytics"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  FileDownloadIcon as FileDown,
  File02Icon as FileJson,
  Loading01Icon as Loader2,
} from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { useToast } from "@/shared/hooks/use-toast"
import { cn } from "@/shared/lib/utils"

export function DataExporter() {
  const [activeFormat, setActiveFormat] = useState<"markdown" | "json" | null>(
    null
  )
  const { toast } = useToast()

  const handleExport = async (format: "markdown" | "json") => {
    try {
      setActiveFormat(format)
      // 允许浏览器在重任务前先渲染出一帧动画
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 50)
          })
        })
      })

      const result = await exportMemos(format)

      if (!result.success) {
        toast({
          title: "导出失败",
          description: result.error || "导出过程中发生错误",
          variant: "destructive",
        })
        return
      }

      const data = result.data || ""

      if (!data) {
        toast({
          title: "导出失败",
          description: "没有可导出的数据",
          variant: "destructive",
        })
        return
      }

      const blob = new Blob([data], {
        type: format === "json" ? "application/json" : "text/markdown",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `memos-export-${new Date().toISOString().split("T")[0]}.${format === "json" ? "json" : "md"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "导出成功",
        description: `数据已导出为 ${format.toUpperCase()} 格式`,
      })
    } catch (err) {
      console.error("[Export] Failed:", err)
      toast({
        title: "操作失败",
        description: "导出过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => setActiveFormat(null), 100)
    }
  }

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h3 className="card-title mb-4">数据管理</h3>
      <p className="caption mb-4">将所有数据导出为本地文件进行备份。</p>
      <div className="flex gap-4">
        <Button
          onClick={() => handleExport("json")}
          disabled={activeFormat !== null}
          className="flex-1 items-center gap-2 active:scale-95 transition-all relative overflow-hidden"
          aria-label="导出完整数据为 JSON 格式"
        >
          <span
            className={cn(
              "flex items-center gap-2 transition-opacity duration-200",
              activeFormat === "json" ? "opacity-0" : "opacity-100"
            )}
          >
            <HugeiconsIcon icon={FileJson} size={16} aria-hidden="true" />
            导出 JSON
          </span>
          {activeFormat === "json" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-primary/40 backdrop-blur-[2px] animate-in fade-in duration-200">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin [will-change:transform]" />
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport("markdown")}
          disabled={activeFormat !== null}
          className="flex-1 items-center gap-2 active:scale-95 transition-all relative overflow-hidden"
          aria-label="导出数据为 Markdown 格式"
        >
          <span
            className={cn(
              "flex items-center gap-2 transition-opacity duration-200",
              activeFormat === "markdown" ? "opacity-0" : "opacity-100"
            )}
          >
            <HugeiconsIcon icon={FileDown} size={16} aria-hidden="true" />
            导出 Markdown
          </span>
          {activeFormat === "markdown" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/40 backdrop-blur-[2px] animate-in fade-in duration-200">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin [will-change:transform]" />
            </div>
          )}
        </Button>
      </div>
    </section>
  )
}
