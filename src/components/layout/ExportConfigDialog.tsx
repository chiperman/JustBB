"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useExport, ExportFormat } from "@/context/ExportContext"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  NoteIcon,
  CodeIcon,
  Download02Icon as Download,
  CheckmarkCircle01Icon as CheckIcon,
  FileExportIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { AdminDialogShell } from "@/components/ui/AdminDialogShell"

interface ExportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportConfigDialog({
  open,
  onOpenChange,
}: ExportConfigDialogProps) {
  const { startExport, status } = useExport()
  const [format, setFormat] = React.useState<ExportFormat>("markdown")

  const handleStart = async () => {
    onOpenChange(false)
    await startExport(format)
  }

  return (
    <AdminDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="导出 Memos"
      subtitle="将你的所有记录打包导出到本地"
      icon={Download}
      maxWidth="max-w-[600px]"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-lg h-10 px-6 font-medium text-[#6b6964] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            取消
          </Button>
          <Button
            onClick={handleStart}
            disabled={
              status !== "idle" && status !== "completed" && status !== "error"
            }
            className="rounded-lg h-10 px-8 bg-[#d97757] hover:bg-[#c46648] text-white shadow-lg shadow-[#d97757]/20 transition-all active:scale-95 font-bold"
          >
            开始导出数据
          </Button>
        </>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#6b6964] uppercase tracking-[0.2em] pl-1">
          <HugeiconsIcon icon={FileExportIcon} size={12} />
          <span>导出配置</span>
        </div>

        <div className="bg-[#f9f7f2] dark:bg-white/[0.01] rounded-2xl p-5 border border-[#1d1d1b]/5 dark:border-white/5 shadow-inner">
          <p className="text-sm text-[#1d1d1b]/80 dark:text-white/70 leading-relaxed font-medium">
            选择你偏好的导出格式。系统将导出所有公开与私密记录，图片将以链接形式保留。
          </p>
        </div>

        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
          className="grid grid-cols-2 gap-4"
        >
          {[
            {
              id: "markdown",
              label: "Markdown",
              icon: NoteIcon,
              desc: "通用格式，适合日记迁移",
            },
            {
              id: "json",
              label: "JSON 数据",
              icon: CodeIcon,
              desc: "原始数据，适合开发者备份",
            },
          ].map((item) => (
            <div key={item.id} className="relative group">
              <RadioGroupItem
                value={item.id}
                id={item.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={item.id}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border p-6 cursor-pointer transition-all duration-300 active:scale-[0.98]",
                  // 基础态
                  "border-[#1d1d1b]/10 dark:border-white/10 bg-[#f6f5f4] dark:bg-white/[0.02] text-[#6b6964] dark:text-[#a39e98]",
                  // 待选态
                  "group-hover:bg-[#efefef] dark:group-hover:bg-white/[0.04] group-hover:border-[#1d1d1b]/20 dark:group-hover:border-white/20",
                  // 选中态
                  "peer-data-[state=checked]:border-[#d97757] peer-data-[state=checked]:bg-[#d97757]/[0.05] peer-data-[state=checked]:text-[#1d1d1b] dark:peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-[0_8px_20px_rgba(217,119,87,0.1)]"
                )}
              >
                <div
                  className={cn(
                    "mb-4 p-3 rounded-xl shadow-sm transition-all duration-300",
                    "bg-white dark:bg-white/5 group-hover:bg-[#f6f5f4] peer-data-[state=checked]:bg-[#d97757]/10 peer-data-[state=checked]:shadow-inner"
                  )}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    className="h-7 w-7 transition-colors duration-300 peer-data-[state=checked]:text-[#d97757]"
                  />
                </div>
                <span className="text-[15px] font-bold tracking-tight transition-colors duration-300">
                  {item.label}
                </span>
                <span className="text-[11px] opacity-60 mt-1.5 font-medium text-center">
                  {item.desc}
                </span>

                {/* 选中标记 */}
                <div className="absolute top-3 right-3 transition-all duration-300 scale-50 opacity-0 peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:scale-100">
                  <div className="bg-[#d97757] rounded-full p-1 shadow-sm">
                    <HugeiconsIcon
                      icon={CheckIcon}
                      size={10}
                      className="text-white"
                    />
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </AdminDialogShell>
  )
}
