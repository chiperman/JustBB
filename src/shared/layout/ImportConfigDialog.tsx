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

export function ImportConfigDialog({ open, onOpenChange }: ImportConfigDialogProps) {
  const { user } = useUser()
  const [file, setFile] = React.useState<File | null>(null)
  const [status, setStatus] = React.useState<
    "idle" | "parsing" | "importing" | "completed" | "error"
  >("idle")
  const [progress, setProgress] = React.useState(0)
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
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

    setStatus("parsing")
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

      setStatus("importing")
      const importResult = await importMemos(parsedMemos, (p) => {
        setProgress(Math.round(((p.success + p.skipped + p.failed) / p.total) * 100))
        setResult(p)
      })

      setResult(importResult)
      setStatus("completed")
    } catch (err) {
      console.error("导入失败:", err)
      setError(err instanceof Error ? err.message : "未知错误")
      setStatus("error")
    }
  }

  const reset = () => {
    setFile(null)
    setStatus("idle")
    setProgress(0)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const [showErrors, setShowErrors] = React.useState(false)

  const [showExamples, setShowExamples] = React.useState(false)
  const [exampleFormat, setExampleFormat] = React.useState("markdown")

  const handleClose = () => {
    if (status === "importing") return // 导入中不允许关闭
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
      maxWidth="max-w-[550px]"
      contentClassName="px-4 py-5 sm:px-8 sm:py-8"
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
              disabled={!user || !file}
              className="h-10 w-full px-8 font-bold sm:w-auto"
            >
              开始导入
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
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-2 pl-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 badge-text uppercase">
            <HugeiconsIcon icon={FileImportIcon} size={14} />
            <span>选择导入文件</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExamples(!showExamples)}
            className="h-7 justify-start px-0 text-[11px] opacity-60 hover:opacity-100 sm:justify-center sm:px-3"
          >
            {showExamples ? "隐藏示例" : "查看支持的格式示例"}
          </Button>
        </div>

        {showExamples && status === "idle" && (
          <div className="rounded-xl border border-border/50 bg-secondary/50 p-3 animate-in fade-in slide-in-from-top-2 duration-300 sm:p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {["markdown", "json", "jsonl"].map((f) => (
                <Button
                  key={f}
                  variant={exampleFormat === f ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExampleFormat(f)}
                  className={cn(
                    "h-7 shrink-0 text-[11px] font-bold uppercase tracking-tight",
                    exampleFormat === f && "bg-background border border-border/50"
                  )}
                >
                  {f === "jsonl" ? "LeanCloud" : f}
                </Button>
              ))}
            </div>

            <div className="max-h-[32dvh] overflow-auto rounded-xl border border-border/40 bg-background/80 p-3 font-mono text-[11px] leading-relaxed sm:max-h-none sm:p-4">
              {exampleFormat === "markdown" && (
                <pre className="text-muted-foreground whitespace-pre-wrap">
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
                <pre className="text-muted-foreground whitespace-pre-wrap">
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
                <pre className="text-muted-foreground whitespace-pre-wrap">
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

        {(status === "parsing" || status === "importing") && (
          <div className="space-y-5 rounded-2xl border border-border bg-background p-5 animate-in fade-in zoom-in duration-300 sm:space-y-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <HugeiconsIcon
                    icon={LoaderIcon}
                    size={20}
                    className="text-primary animate-spin"
                  />
                </div>
                <div>
                  <p className="body-large font-bold">正在导入记录...</p>
                  <p className="caption opacity-60">请勿关闭弹窗或刷新页面</p>
                </div>
              </div>
              <span className="body-large font-mono font-bold text-primary">{progress}%</span>
            </div>

            <Progress value={progress} className="h-2" />

            {result && (
              <div className="grid grid-cols-3 gap-2 pt-2 sm:gap-4">
                <div className="text-center p-3 bg-secondary rounded-xl">
                  <p className="micro-label uppercase opacity-50 mb-1">成功</p>
                  <p className="body-large font-bold text-green-600">{result.success}</p>
                </div>
                <div className="text-center p-3 bg-secondary rounded-xl">
                  <p className="micro-label uppercase opacity-50 mb-1">重复</p>
                  <p className="body-large font-bold text-amber-600">{result.skipped}</p>
                </div>
                <div className="text-center p-3 bg-secondary rounded-xl">
                  <p className="micro-label uppercase opacity-50 mb-1">失败</p>
                  <p className="body-large font-bold text-red-600">{result.failed}</p>
                </div>
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

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
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
                  <p className="micro-label uppercase opacity-50 mb-1">{item.label}</p>
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
