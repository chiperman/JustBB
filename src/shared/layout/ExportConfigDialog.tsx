"use client"

import * as React from "react"
import { Button } from "@/shared/ui/button"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Label } from "@/shared/ui/label"
import { useExport, ExportFormat } from "@/state/ExportContext"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  NoteIcon,
  CodeIcon,
  Download02Icon as Download,
  CheckmarkCircle01Icon as CheckIcon,
  FileExportIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"
import { AdminDialogShell } from "@/shared/ui/AdminDialogShell"
import { useUser } from "@/state/UserContext"

interface ExportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportConfigDialog({ open, onOpenChange }: ExportConfigDialogProps) {
  const { startExport, status } = useExport()
  const { user } = useUser()
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
      contentClassName="px-4 py-5 sm:px-8 sm:py-8"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full px-6 font-medium text-muted-foreground sm:w-auto"
          >
            取消
          </Button>
          <Button
            onClick={handleStart}
            disabled={!user || (status !== "idle" && status !== "completed" && status !== "error")}
            className="h-10 w-full px-8 font-bold sm:w-auto"
          >
            开始导出数据
          </Button>
        </div>
      }
    >
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2 badge-text uppercase pl-1">
          <HugeiconsIcon icon={FileExportIcon} size={14} />
          <span>导出配置</span>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <p className="body-text text-foreground opacity-80">
            选择你偏好的导出格式。系统将导出所有公开与私密记录，图片将以链接形式保留。
          </p>
        </div>

        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6"
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
              <RadioGroupItem value={item.id} id={item.id} className="peer sr-only" />
              <Label
                htmlFor={item.id}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border p-5 transition-all duration-300 [@media(pointer:coarse)]:active:scale-95 sm:p-8",
                  // 基础态
                  "border-border bg-background text-muted-foreground",
                  // 待选态
                  "group-hover:border-primary/20 hover:bg-secondary",
                  // 选中态
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-(--badge-clay-bg) peer-data-[state=checked]:text-primary"
                )}
              >
                <div
                  className={cn(
                    "mb-4 p-4 rounded-full transition-all duration-300",
                    "bg-secondary peer-data-[state=checked]:bg-primary/10"
                  )}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    className="h-7 w-7 transition-colors duration-300 peer-data-[state=checked]:text-primary"
                  />
                </div>
                <span className="text-[16px] font-bold tracking-tight transition-colors duration-300">
                  {item.label}
                </span>
                <span className="caption opacity-60 mt-1.5 text-center">{item.desc}</span>

                {/* 选中标记 */}
                <div className="absolute top-4 right-4 transition-all duration-300 scale-50 opacity-0 peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:scale-100">
                  <HugeiconsIcon icon={CheckIcon} size={18} className="text-primary" />
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </AdminDialogShell>
  )
}
