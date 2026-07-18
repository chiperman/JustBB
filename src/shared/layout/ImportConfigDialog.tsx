"use client"

import * as React from "react"
import { Button } from "@/shared/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Upload02Icon as Upload,
  FileImportIcon,
  CheckmarkCircle01Icon as CheckIcon,
  Cancel01Icon as CancelIcon,
  Loading01Icon as LoaderIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"
import { AdminDialogShell } from "@/shared/ui/AdminDialogShell"
import {
  parseJSON,
  parseMarkdown,
  parseLeanCloud,
  ParsedMemo,
} from "@/server/services/import/parsers"
import { importMemos, ImportResult } from "@/server/services/import/importService"
import { Progress } from "@/shared/ui/progress"
import { useUser } from "@/state/UserContext"

interface ImportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MIN_PROGRESS_DISPLAY_MS = 1_200
const PROGRESS_STEP_DELAY_MS = 160

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function ImportConfigDialog({ open, onOpenChange }: ImportConfigDialogProps) {
  const { user } = useUser()
  const [file, setFile] = React.useState<File | null>(null)
  const [status, setStatus] = React.useState<"idle" | "importing" | "completed" | "error">("idle")
  const [progress, setProgress] = React.useState(0)
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isPreparingImport, setIsPreparingImport] = React.useState(false)
  const fileInputId = React.useId()

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleStartImport = async () => {
    if (!file) return

    setIsPreparingImport(true)
    setProgress(0)

    try {
      const content = await file.text()
      let parsedMemos: ParsedMemo[] = []

      if (file.name.endsWith(".json")) {
        parsedMemos = parseJSON(content)
      } else if (file.name.endsWith(".md")) {
        parsedMemos = parseMarkdown(content)
      } else if (file.name.endsWith(".jsonl")) {
        parsedMemos = parseLeanCloud(content)
      } else {
        throw new Error("不支持的文件格式。请使用 .json, .md 或 .jsonl 文件。")
      }

      if (parsedMemos.length === 0) {
        throw new Error("未在文件中找到有效的记录。")
      }

      setResult({
        total: parsedMemos.length,
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      })
      setStatus("importing")
      setIsPreparingImport(false)
      const progressStartedAt = Date.now()

      // 先展示 0%，再逐批呈现真实结果；本地导入再快也不会直接跳到完成态。
      await delay(PROGRESS_STEP_DELAY_MS)
      let progressQueue = Promise.resolve()
      const importResult = await importMemos(parsedMemos, (p) => {
        progressQueue = progressQueue.then(async () => {
          await delay(PROGRESS_STEP_DELAY_MS)
          setProgress(Math.round(((p.success + p.skipped + p.failed) / p.total) * 100))
          setResult(p)
        })
      })

      await progressQueue
      setResult(importResult)
      setProgress(100)
      const remainingDuration = MIN_PROGRESS_DISPLAY_MS - (Date.now() - progressStartedAt)
      if (remainingDuration > 0) {
        await delay(remainingDuration)
      }
      setStatus("completed")
    } catch (err) {
      setIsPreparingImport(false)
      console.error("导入失败:", err)
      setError(err instanceof Error ? err.message : "未知错误")
      setStatus("error")
    }
  }

  const reset = () => {
    setFile(null)
    setStatus("idle")
    setIsPreparingImport(false)
    setProgress(0)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const [showErrors, setShowErrors] = React.useState(false)

  const [showExamples, setShowExamples] = React.useState(false)
  const [exampleFormat, setExampleFormat] = React.useState("markdown")

  const handleClose = () => {
    if (status === "importing" || isPreparingImport) return // 导入中不允许关闭
    onOpenChange(false)
    if (status === "completed" || status === "error") {
      setTimeout(reset, 300)
    }
  }

  return (
    <AdminDialogShell
      open={open}
      onOpenChange={handleClose}
      title="导入 Memos"
      subtitle="从备份文件或第三方平台迁移你的记录"
      icon={Upload}
      maxWidth="max-w-[760px]"
      contentClassName="px-5 py-6 sm:px-7 sm:py-6"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          {(status === "idle" || status === "error") && (
            <Button
              variant="ghost"
              onClick={handleClose}
              className="h-10 w-full px-6 font-medium text-muted-foreground sm:w-auto"
            >
              取消
            </Button>
          )}
          {status === "idle" && (
            <Button
              onClick={handleStartImport}
              disabled={!user || !file || isPreparingImport}
              className="h-10 w-full px-8 font-bold sm:w-auto"
            >
              {isPreparingImport ? "正在准备…" : "开始导入"}
            </Button>
          )}
          {(status === "completed" || status === "error") && (
            <Button onClick={handleClose} className="h-10 w-full px-8 font-bold sm:w-auto">
              完成
            </Button>
          )}
        </div>
      }
    >
      <div className="min-w-0 space-y-4 sm:space-y-5">
        {status === "idle" && (
          <>
            <div className="flex items-center justify-between gap-3 pl-1">
              <div className="flex items-center gap-2 badge-text uppercase">
                <HugeiconsIcon icon={FileImportIcon} size={14} />
                <span>选择导入文件</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
                className="h-8 shrink-0 px-3 text-[11px] font-semibold"
              >
                {showExamples ? "隐藏示例" : "查看支持的格式示例"}
              </Button>
            </div>

            {showExamples && (
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-secondary/40 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex gap-1 border-b border-border/50 bg-background/50 p-2">
                  {["markdown", "json", "jsonl"].map((f) => (
                    <Button
                      key={f}
                      variant={exampleFormat === f ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setExampleFormat(f)}
                      className={cn(
                        "h-8 shrink-0 px-3 text-[11px] font-bold uppercase tracking-tight",
                        exampleFormat === f && "border border-border/50 bg-background shadow-sm"
                      )}
                    >
                      {f === "jsonl" ? "LeanCloud" : f}
                    </Button>
                  ))}
                </div>

                <div className="h-56 min-w-0 overflow-auto bg-background/80 p-4 font-mono text-[11px] leading-relaxed sm:h-60">
                  {exampleFormat === "markdown" && (
                    <pre className="text-muted-foreground whitespace-pre-wrap break-words">
                      <span className="text-primary font-bold">### [2020/9/28 20:14:05]</span>
                      {"\n"}
                      <span className="opacity-60">
                        {
                          '<!-- \n  {\n    "id": "5f71d38d...8a26", // 可选：用于判重\n    "memo_number": 102, // 可选：记录编号\n    "created_at": "2020-09-28T12:14:05.559Z", // 必填\n    "updated_at": "2024-05-18T04:31:40.124Z", // 可选\n    "deleted_at": null, // 可选：回收站时间\n    "tags": ["💤梦"], // 可选\n    "is_private": false, // 可选：默认公开\n    "is_pinned": true, // 可选：默认不置顶\n    "pinned_at": "2024-05-18T04:31:40.124Z", // 可选\n    "word_count": 45, // 可选\n    "locations": [{"name": "教学楼", "lat": 30.1, "lng": 104.2}], // 可选\n    "access_code_hash": null, // 可选\n    "access_code_hint": null // 可选\n  }\n-->'
                        }
                      </span>
                      {"\n"}
                      {"\n"}
                      梦见回到高中校园，在操场上和同学一起骑自行车...{" "}
                      <span className="text-primary opacity-60">{"// 必填"}</span>
                      {"\n"}
                      {"\n"}
                      <span className="opacity-40">---</span>
                    </pre>
                  )}
                  {exampleFormat === "json" && (
                    <pre className="text-muted-foreground whitespace-pre-wrap break-words">
                      {"["}
                      {"\n"}
                      {"  {"}
                      {"\n"}
                      {'    "id": "5f71d38d-95e5-0238-f122-8a26", // 可选'}
                      {"\n"}
                      {'    "memo_number": 102, // 可选'}
                      {"\n"}
                      {'    "content": "梦见回到高中校园... ", // 必填'}
                      {"\n"}
                      {'    "created_at": "2020-09-28T12:14:05.559Z", // 必填'}
                      {"\n"}
                      {'    "updated_at": "2024-05-18T04:31:40.124Z", // 可选'}
                      {"\n"}
                      {'    "deleted_at": null, // 可选'}
                      {"\n"}
                      {'    "tags": ["💤梦"], // 可选'}
                      {"\n"}
                      {'    "is_private": false, // 可选'}
                      {"\n"}
                      {'    "is_pinned": true, // 可选'}
                      {"\n"}
                      {'    "pinned_at": "2024-05-18T04:31:40.124Z", // 可选'}
                      {"\n"}
                      {'    "word_count": 45, // 可选'}
                      {"\n"}
                      {'    "locations": [{"name": "教学楼", "lat": 30.1, "lng": 104.2}], // 可选'}
                      {"\n"}
                      {'    "access_code_hash": null, // 可选'}
                      {"\n"}
                      {'    "access_code_hint": null // 可选'}
                      {"\n"}
                      {"  }"}
                      {"\n"}
                      {"]"}
                    </pre>
                  )}
                  {exampleFormat === "jsonl" && (
                    <pre className="text-muted-foreground whitespace-pre-wrap break-words">
                      <span className="opacity-50">{"// LeanCloud 核心字段对照"}</span>
                      {"\n"}
                      {"{"}
                      {"\n"}
                      {'  "objectId": "5f71d38d...8a26", // 对应 id'}
                      {"\n"}
                      {'  "content": "梦见回到高中校园...", // 对应 content'}
                      {"\n"}
                      {'  "tag": "# 💤梦", // 对应 tags'}
                      {"\n"}
                      {'  "createdAt": "2020-09-28T12:14:05.559Z", // 对应 created_at'}
                      {"\n"}
                      {'  "updatedAt": "2024-05-18T04:31:40.124Z" // 对应 updated_at'}
                      {"\n"}
                      {"}"}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {status === "idle" && (
          <>
            <input
              id={fileInputId}
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.md,.jsonl"
              className="peer sr-only"
            />

            <label
              htmlFor={fileInputId}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 outline-none transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 sm:p-10",
                file
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary"
              )}
            >
              <span
                className={cn(
                  "mb-4 block p-4 rounded-full transition-all duration-300",
                  file
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                )}
              >
                <HugeiconsIcon icon={file ? FileImportIcon : Upload} size={32} />
              </span>

              <span className="block text-center">
                <span className="body-large block font-bold">
                  {file ? file.name : "点击选择文件"}
                </span>
                <span className="caption mt-1 block opacity-60">支持 .json, .md, .jsonl 格式</span>
              </span>
            </label>
          </>
        )}

        {status === "importing" && (
          <div className="space-y-5 rounded-2xl border border-border bg-background p-5 animate-in fade-in zoom-in duration-300 sm:space-y-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <HugeiconsIcon icon={LoaderIcon} size={32} className="animate-spin" />
                </div>
                <div>
                  <p className="body-large text-[18px] font-bold">正在导入记录...</p>
                  <p className="body-text opacity-70">
                    已处理 {result ? result.success + result.skipped + result.failed : 0} /{" "}
                    {result?.total ?? 0} 条
                  </p>
                </div>
              </div>
              <span className="body-large font-mono font-bold text-primary">{progress}%</span>
            </div>

            <Progress value={progress} className="h-2" />

            {result && (
              <div className="grid grid-cols-2 gap-2 pt-2 md:grid-cols-4 md:gap-4">
                {[
                  { label: "总数", value: result.total, color: "text-foreground" },
                  { label: "成功", value: result.success, color: "text-green-600" },
                  { label: "重复跳过", value: result.skipped, color: "text-amber-600" },
                  { label: "失败", value: result.failed, color: "text-red-600" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/50 bg-secondary p-3 text-center"
                  >
                    <p className="micro-label mb-1 whitespace-nowrap uppercase opacity-50">
                      {item.label}
                    </p>
                    <p className={cn("body-large font-bold", item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {result && result.failed > 0 && (
              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrors(!showErrors)}
                  className="w-full text-xs text-muted-foreground hover:text-red-600 flex items-center justify-center gap-1"
                >
                  <HugeiconsIcon icon={CancelIcon} size={14} />
                  {showErrors ? "隐藏错误详情" : `查看 ${result.failed} 条失败详情`}
                </Button>

                {showErrors && (
                  <div className="mt-3 max-h-[24dvh] overflow-y-auto rounded-xl border border-red-200 bg-red-50/30 p-2 space-y-1 custom-scrollbar sm:max-h-40">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-background/50 rounded-lg border border-red-100/50 flex flex-col gap-0.5"
                      >
                        <p className="text-[11px] font-bold truncate">{err.summary}</p>
                        <p className="text-[10px] text-red-500 opacity-80">{err.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {status === "completed" && result && (
          <div className="space-y-5 rounded-2xl border border-border bg-background p-5 animate-in fade-in zoom-in duration-300 sm:space-y-6 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <HugeiconsIcon icon={CheckIcon} size={32} />
              </div>
              <div>
                <p className="body-large font-bold text-green-600 text-[18px]">导入成功！</p>
                <p className="body-text opacity-70">所有记录处理完毕，数据已同步。</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
              {[
                {
                  label: "总数",
                  value: result.total,
                  color: "text-foreground",
                },
                {
                  label: "成功",
                  value: result.success,
                  color: "text-green-600",
                },
                {
                  label: "重复跳过",
                  value: result.skipped,
                  color: "text-amber-600",
                },
                { label: "失败", value: result.failed, color: "text-red-600" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/50 bg-secondary p-3 text-center"
                >
                  <p className="micro-label mb-1 whitespace-nowrap uppercase opacity-50">
                    {item.label}
                  </p>
                  <p className={cn("body-large font-bold", item.color)}>{item.value}</p>
                </div>
              ))}
            </div>

            {result.failed > 0 && (
              <div className="pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrors(!showErrors)}
                  className="w-full text-xs text-muted-foreground hover:text-red-600 flex items-center justify-center gap-1"
                >
                  <HugeiconsIcon icon={CancelIcon} size={14} />
                  {showErrors ? "隐藏错误详情" : `查看 ${result.failed} 条失败详情`}
                </Button>

                {showErrors && (
                  <div className="mt-3 max-h-[26dvh] overflow-y-auto rounded-xl border border-red-200 bg-red-50/30 p-3 space-y-1 custom-scrollbar sm:max-h-48">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-background/80 rounded-lg border border-red-100/50 flex flex-col gap-1"
                      >
                        <p className="text-[12px] font-bold text-foreground leading-tight">
                          {err.summary}
                        </p>
                        <p className="text-[11px] text-red-500 opacity-90">{err.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 animate-in fade-in zoom-in duration-300 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                <HugeiconsIcon icon={CancelIcon} size={32} />
              </div>
              <div>
                <p className="body-large font-bold text-destructive">导入过程中出错</p>
                <p className="caption text-destructive opacity-80">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="w-full border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              重试
            </Button>
          </div>
        )}
      </div>
    </AdminDialogShell>
  )
}
