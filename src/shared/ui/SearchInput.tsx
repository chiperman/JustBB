"use client"

import { useEffect, useState, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon, Calendar03Icon, Tag01Icon } from "@hugeicons/core-free-icons"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/shared/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

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

  const [value, setValue] = useState(q)
  const [activeChips, setActiveChips] = useState<ActiveChip[]>([])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(q)
  }, [q])

  useEffect(() => {
    setActiveChips((prev) => {
      const currentChips: ActiveChip[] = []
      if (tag) currentChips.push({ type: "tag", value: tag, label: `#${tag}` })
      if (num) currentChips.push({ type: "num", value: num, label: `#${num}` })
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
    replace(`/?${params.toString()}`)
    inputRef.current?.focus()
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
    let newTag: string | null = null
    let newNum: string | null = null
    const remainingWords: string[] = []

    for (const token of tokens) {
      const tagMatch = token.match(/^(?:tag|t):(.+)$/i)
      const numMatch = token.match(/^(?:num|n|id):(\d+)$/i)

      if (tagMatch) {
        const val = tagMatch[1].trim()
        if (val) newTag = val
      } else if (numMatch) {
        const val = numMatch[1].trim()
        if (val) newNum = val
      } else {
        remainingWords.push(token)
      }
    }

    if (newTag) {
      params.set("tag", newTag)
    }
    if (newNum) {
      params.set("num", newNum)
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

        {/* 清除文本按钮 */}
        {value && (
          <button
            onClick={handleClear}
            className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors active:scale-90 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="清空搜索"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        )}
      </div>

      {/* 过滤标签下置流式展示 */}
      <div className="absolute top-full left-0 right-0 flex flex-wrap items-center gap-1.5 mt-2 px-1 select-none z-10">
        <AnimatePresence>
          {activeChips.map((chip) => {
            const icon = chip.type === "tag" ? Tag01Icon : Calendar03Icon
            return (
              <motion.div
                key={`${chip.type}-${chip.value}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-(--badge-clay-bg) badge-text rounded-md border border-primary/10 shrink-0 h-5 hover:bg-primary/[0.03] transition-colors"
              >
                {chip.type !== "num" && <HugeiconsIcon icon={icon} size={10} />}
                <span>{chip.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeChip(chip)
                  }}
                  className="hover:bg-primary/10 rounded-full p-0.5 transition-colors ml-0.5 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  title={`移除过滤: ${chip.label}`}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={8} />
                </button>
              </motion.div>
            )
          })}
          {activeChips.length >= 2 && (
            <motion.button
              key="clear-all-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={clearAllChips}
              className="text-xs text-muted-foreground/60 hover:text-primary transition-colors px-1 py-0.5 hover:bg-secondary/40 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              清除全部
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
