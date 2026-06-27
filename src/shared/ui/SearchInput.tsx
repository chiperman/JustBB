"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Cancel01Icon,
  Calendar03Icon,
  Tag01Icon,
  HashtagIcon,
} from "@hugeicons/core-free-icons"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/shared/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { ShortcutHint } from "@/shared/shortcuts/ShortcutHint"
import { useShortcut } from "@/shared/shortcuts/useShortcut"

interface ActiveChip {
  type: "tag" | "num" | "date" | "year-month"
  value: string
  label: string
}

export function SearchInput() {
  const searchParams = useSearchParams()
  const { replace } = useRouter()
  const q = searchParams.get("query") || ""
  const tag = searchParams.get("tag")
  const num = searchParams.get("num")
  const date = searchParams.get("date")
  const year = searchParams.get("year")
  const month = searchParams.get("month")
  const tagMode = searchParams.get("tagMode") || "and"

  const [value, setValue] = useState(q)
  const [activeChips, setActiveChips] = useState<ActiveChip[]>([])

  const inputRef = useRef<HTMLInputElement>(null)

  const focusSearchInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const focusSearchShortcut = useMemo(
    () => ({
      id: "search.focus",
      binding: "mod+k",
      description: "聚焦搜索框",
      group: "搜索",
      handler: focusSearchInput,
      preventDefault: true,
    }),
    [focusSearchInput]
  )

  useShortcut(focusSearchShortcut)

  useEffect(() => {
    setValue(q)
  }, [q])

  useEffect(() => {
    setActiveChips((prev) => {
      const currentChips: ActiveChip[] = []
      if (tag) {
        tag.split(",").forEach((t) => {
          const trimmed = t.trim()
          if (trimmed) {
            currentChips.push({ type: "tag", value: trimmed, label: trimmed })
          }
        })
      }
      if (num) {
        num.split(",").forEach((n) => {
          const trimmed = n.trim()
          if (trimmed) {
            currentChips.push({ type: "num", value: trimmed, label: trimmed })
          }
        })
      }
      if (date) currentChips.push({ type: "date", value: date, label: date })
      if (year && month) {
        currentChips.push({
          type: "year-month",
          value: `${year}-${month}`,
          label: `${year}-${month}`,
        })
      }

      const preserved = prev.filter((p) =>
        currentChips.some((c) => c.type === p.type && c.value === p.value)
      )
      const added = currentChips.filter(
        (c) => !preserved.some((p) => p.type === c.type && p.value === c.value)
      )
      return [...preserved, [...added].reverse()].flat() // 保持之前的大体顺序，仅平铺展示
    })
  }, [searchParams, tag, num, date, year, month])

  const removeChip = (chip: ActiveChip) => {
    const params = new URLSearchParams(searchParams.toString())
    if (chip.type === "year-month") {
      params.delete("year")
      params.delete("month")
    } else if (chip.type === "tag" || chip.type === "num") {
      const existing = params.get(chip.type) || ""
      const list = existing
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
      const filtered = list.filter((item) => item !== chip.value)
      if (filtered.length > 0) {
        params.set(chip.type, filtered.join(","))
      } else {
        params.delete(chip.type)
      }
    } else {
      params.delete(chip.type)
    }
    replace(`/?${params.toString()}`)
    inputRef.current?.focus()
  }

  const clearAllChips = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("tag")
    params.delete("num")
    params.delete("date")
    params.delete("year")
    params.delete("month")
    params.delete("tagMode")
    replace(`/?${params.toString()}`)
    inputRef.current?.focus()
  }

  const toggleTagMode = () => {
    const params = new URLSearchParams(searchParams.toString())
    const nextMode = tagMode === "and" ? "or" : "and"
    if (nextMode === "or") {
      params.set("tagMode", "or")
    } else {
      params.delete("tagMode")
    }
    replace(`/?${params.toString()}`)
  }

  const performSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const trimmedTerm = term.trim()

    if (!trimmedTerm) {
      params.delete("query")
      setValue("")
      replace(`/?${params.toString()}`)
      return
    }

    const tokens = trimmedTerm.split(/\s+/)
    const newTags: string[] = []
    const newNums: string[] = []
    const remainingWords: string[] = []

    for (const token of tokens) {
      const tagMatch = token.match(/^(?:tag|t):(.+)$/i)
      const numMatch = token.match(/^(?:num|n|id):(\d+)$/i)

      if (tagMatch) {
        const val = tagMatch[1].trim()
        if (val) newTags.push(val)
      } else if (numMatch) {
        const val = numMatch[1].trim()
        if (val) newNums.push(val)
      } else {
        remainingWords.push(token)
      }
    }

    if (newTags.length > 0) {
      const existing = params.get("tag") ? params.get("tag")!.split(",") : []
      const merged = [...new Set([...existing, ...newTags])].map((x) => x.trim()).filter(Boolean)
      if (merged.length > 0) {
        params.set("tag", merged.join(","))
      }
    }
    if (newNums.length > 0) {
      const existing = params.get("num") ? params.get("num")!.split(",") : []
      const merged = [...new Set([...existing, ...newNums])].map((x) => x.trim()).filter(Boolean)
      if (merged.length > 0) {
        params.set("num", merged.join(","))
      }
    }

    const finalQuery = remainingWords.join(" ").trim()
    if (finalQuery) {
      params.set("query", finalQuery)
      setValue(finalQuery)
    } else {
      params.delete("query")
      setValue("")
    }

    replace(`/?${params.toString()}`)
  }

  const handleClear = () => {
    setValue("")
    performSearch("")
  }

  return (
    <div className="relative w-full">
      {/* 搜索框输入主体 */}
      <div className="relative flex items-center min-h-[36px] bg-background border border-border rounded-md px-2 focus-within:border-primary/30 transition-all hover:bg-secondary/50 group">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className={cn(
            "shrink-0 ml-1 transition-colors",
            value || activeChips.length > 0 ? "text-primary/70" : "text-muted-foreground/50"
          )}
        />

        <input
          ref={inputRef}
          type="text"
          aria-label="搜索 Memo"
          data-search-input="memo"
          placeholder="键入关键词搜索..."
          className="flex-1 min-w-0 bg-transparent border-none outline-none ring-0 p-0 pl-2 h-full text-sm text-foreground placeholder:text-muted-foreground/40"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              performSearch(value)
            }
          }}
        />

        {!value && <ShortcutHint shortcut="mod+k" className="mr-1 hidden sm:inline-flex" />}

        {/* 框内集成切换按钮 (当有 2 个及以上 tag 时显示) */}
        {activeChips.filter((c) => c.type === "tag").length >= 2 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggleTagMode()
                }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-primary transition-colors mr-1 outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 select-none"
                aria-label={
                  tagMode === "or"
                    ? "当前为：包含任一标签，点击切换为包含全部标签"
                    : "当前为：包含全部标签，点击切换为包含任一标签"
                }
              >
                {tagMode === "or" ? "OR" : "AND"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px]">
              {tagMode === "or"
                ? "当前为：包含任一标签，点击切换为包含全部标签"
                : "当前为：包含全部标签，点击切换为包含任一标签"}
            </TooltipContent>
          </Tooltip>
        )}

        {/* 清除文本按钮 */}
        {value && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleClear}
                className="p-1 text-muted-foreground/30 hover:text-muted-foreground hover:bg-primary/5 rounded-full transition-colors active:scale-95 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="清空搜索"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">清空搜索</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* 过滤标签下置流式展示 */}
      {activeChips.length > 0 && (
        <div className="absolute top-full left-0 right-0 flex items-start justify-between select-none z-10 w-full mt-2">
          {/* 左侧可滚动内容区 */}
          <div className="flex-1 min-w-0 flex flex-nowrap items-start gap-1.5 h-9 overflow-x-auto overflow-y-hidden">
            <AnimatePresence>
              {activeChips.map((chip) => {
                let icon = Tag01Icon
                if (chip.type === "date" || chip.type === "year-month") {
                  icon = Calendar03Icon
                } else if (chip.type === "num") {
                  icon = HashtagIcon
                }
                const chipKey =
                  chip.type === "date" || chip.type === "year-month"
                    ? chip.type
                    : `${chip.type}-${chip.value}`
                return (
                  <motion.div
                    key={chipKey}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-(--badge-clay-bg) badge-text rounded-md border border-primary/10 shrink-0 h-5 hover:bg-primary/[0.03] transition-colors"
                  >
                    <HugeiconsIcon icon={icon} size={10} />
                    <SearchInputChipLabel label={chip.label} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeChip(chip)
                          }}
                          className="hover:bg-primary/10 rounded-full p-0.5 transition-colors ml-0.5 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          aria-label={`移除过滤: ${chip.label}`}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={8} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{`移除过滤: ${chip.label}`}</TooltipContent>
                    </Tooltip>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* 右侧固定不滚动的重置按钮 */}
          <AnimatePresence>
            {activeChips.length >= 2 && (
              <motion.button
                key="clear-all-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={clearAllChips}
                className="text-xs text-muted-foreground/60 hover:text-primary transition-colors px-1 py-0.5 hover:bg-secondary/40 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 ml-2 mt-0.5"
              >
                重置
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function SearchInputChipLabel({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const el = spanRef.current
      if (el && el.scrollWidth > el.offsetWidth) {
        setOpen(true)
      }
    } else {
      setOpen(false)
    }
  }

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <span ref={spanRef} className="truncate max-w-[150px] cursor-default flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="inline-block"
            >
              {label}
            </motion.div>
          </AnimatePresence>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs font-normal">{label}</TooltipContent>
    </Tooltip>
  )
}
