"use client"

import { useEffect, useState, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon, Calendar03Icon, Tag01Icon } from "@hugeicons/core-free-icons"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/shared/lib/utils"

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
  const chipRefs = useRef<(HTMLDivElement | null)[]>([])
  const pendingFocusIndexRef = useRef<number | "input" | null>(null)

  useEffect(() => {
    if (pendingFocusIndexRef.current !== null) {
      if (pendingFocusIndexRef.current === "input") {
        inputRef.current?.focus()
      } else if (typeof pendingFocusIndexRef.current === "number") {
        const targetIndex = pendingFocusIndexRef.current
        if (targetIndex >= 0 && targetIndex < activeChips.length) {
          chipRefs.current[targetIndex]?.focus()
        } else {
          inputRef.current?.focus()
        }
      }
      pendingFocusIndexRef.current = null
    }
  }, [activeChips])

  useEffect(() => {
    setValue(q)
  }, [q])

  const hasContext = !!(tag || num || date || (year && month))

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
      return [...preserved, ...added]
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
  }

  const performSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const trimmedTerm = term.trim()

    const tagMatch = trimmedTerm.match(/^(?:tag|t):(.+)$/i)
    const numMatch = trimmedTerm.match(/^(?:num|n|id):(\d+)$/i)

    if (tagMatch) {
      const tagValue = tagMatch[1].trim()
      if (tagValue) {
        params.set("tag", tagValue)
        params.delete("query")
        setValue("")
      }
    } else if (numMatch) {
      const numValue = numMatch[1].trim()
      if (numValue) {
        params.set("num", numValue)
        params.delete("query")
        setValue("")
      }
    } else {
      if (trimmedTerm) {
        params.set("query", trimmedTerm)
      } else {
        params.delete("query")
      }
    }
    replace(`/?${params.toString()}`)
  }

  const handleClear = () => {
    setValue("")
    performSearch("")
  }

  const handleChipKeyDown = (e: React.KeyboardEvent, chip: ActiveChip, index: number) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      if (activeChips.length <= 1) {
        pendingFocusIndexRef.current = "input"
      } else {
        const nextTargetIndex = index < activeChips.length - 1 ? index : index - 1
        if (nextTargetIndex >= 0) {
          pendingFocusIndexRef.current = nextTargetIndex
        } else {
          pendingFocusIndexRef.current = "input"
        }
      }
      removeChip(chip)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      if (index > 0) {
        chipRefs.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      if (index < activeChips.length - 1) {
        chipRefs.current[index + 1]?.focus()
      } else {
        inputRef.current?.focus()
      }
    }
  }

  return (
    <div className="relative w-full group">
      <div className="relative flex items-center min-h-[36px] bg-background border border-border rounded-md px-2 focus-within:border-primary/30 transition-all hover:bg-secondary/50 group">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 pr-8 py-1.5">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className={cn(
              "shrink-0 ml-1 transition-colors",
              value || hasContext ? "text-primary/70" : "text-muted-foreground/50"
            )}
          />

          {/* Chips Section */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeChips.map((chip, index) => {
              const icon = chip.type === "tag" ? Tag01Icon : Calendar03Icon
              return (
                <div
                  key={`${chip.type}-${chip.value}`}
                  ref={(el) => {
                    chipRefs.current[index] = el
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => handleChipKeyDown(e, chip, index)}
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-(--badge-clay-bg) badge-text rounded-md border border-primary/10 shrink-0 h-5 outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer hover:bg-primary/[0.03] transition-colors"
                >
                  {chip.type !== "num" && <HugeiconsIcon icon={icon} size={10} />}
                  <span>{chip.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      pendingFocusIndexRef.current = "input"
                      removeChip(chip)
                    }}
                    tabIndex={-1}
                    className="hover:bg-primary/10 rounded-full p-0.5 transition-colors ml-0.5 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={8} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Editable Search Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder={hasContext ? "" : "键入关键词搜索..."}
            className="flex-1 min-w-[60px] bg-transparent border-none outline-none ring-0 p-0 h-full text-sm text-foreground placeholder:text-muted-foreground/40"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                performSearch(value)
              } else if (e.key === "Backspace" && !value && activeChips.length > 0) {
                e.preventDefault()
                const lastChip = activeChips[activeChips.length - 1]
                pendingFocusIndexRef.current = "input"
                removeChip(lastChip)
              } else if (
                e.key === "ArrowLeft" &&
                e.currentTarget.selectionStart === 0 &&
                e.currentTarget.selectionEnd === 0 &&
                activeChips.length > 0
              ) {
                e.preventDefault()
                chipRefs.current[activeChips.length - 1]?.focus()
              }
            }}
          />
        </div>

        <div className="shrink-0 flex items-center gap-1">
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
      </div>
    </div>
  )
}
