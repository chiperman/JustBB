"use client"

import * as React from "react"
import { useExport } from "@/context/ExportContext"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PauseIcon,
  PlayIcon,
  Cancel01Icon,
  Loading03Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"

export function ExportProgressPanel() {
  const { status, progress, total, pauseExport, resumeExport, cancelExport } =
    useExport()

  if (status === "idle") return null

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-xl border border-border/40 bg-popover/80 p-4 shadow-notion-deep backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status === "exporting" && (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="h-4 w-4 animate-spin text-primary"
            />
          )}
          {status === "paused" && (
            <HugeiconsIcon
              icon={PauseIcon}
              className="h-4 w-4 text-amber-500"
            />
          )}
          {status === "completed" && (
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              className="h-4 w-4 text-green-500"
            />
          )}
          {status === "error" && (
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="h-4 w-4 text-destructive"
            />
          )}
          <span className="text-sm font-medium">
            {status === "exporting" && "正在准备导出..."}
            {status === "paused" && "导出已暂停"}
            {status === "completed" && "导出完成"}
            {status === "error" && "导出出错"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-muted"
          onClick={cancelExport}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>
            {progress} / {total} 条记录
          </span>
          <span>{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        {status === "exporting" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-[12px] border-border/50"
            onClick={pauseExport}
          >
            <HugeiconsIcon icon={PauseIcon} className="mr-1.5 h-3.5 w-3.5" />
            暂停
          </Button>
        )}
        {status === "paused" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-[12px] border-border/50"
            onClick={resumeExport}
          >
            <HugeiconsIcon icon={PlayIcon} className="mr-1.5 h-3.5 w-3.5" />
            继续
          </Button>
        )}
        {(status === "completed" || status === "error") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-[12px]"
            onClick={cancelExport}
          >
            关闭
          </Button>
        )}
      </div>
    </div>
  )
}
