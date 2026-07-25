"use client"

import { motion, useReducedMotion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Location04Icon } from "@hugeicons/core-free-icons"

import { MemoCard } from "@/features/memos"
import type { MapMarker } from "@/shared/lib/location-cache"
import { Button } from "@/shared/ui/button"
import { useOptionalUnlockedMemos } from "@/state/UnlockedMemosContext"
import type { Memo } from "@/types/memo"

interface MapDetailPanelProps {
  marker: MapMarker
  onClose: () => void
}

function protectLockedMemo(memo: Memo): Memo {
  if (!memo.is_locked) return memo

  return {
    ...memo,
    content: "",
    tags: [],
    images: [],
    image_metadata: {},
    word_count: 0,
  }
}

export function MapDetailPanel({ marker, onClose }: MapDetailPanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const unlockedMemosContext = useOptionalUnlockedMemos()

  return (
    <motion.aside
      initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
      transition={
        shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 440, damping: 40 }
      }
      className="absolute inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex max-h-[64%] flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_4px_24px_rgba(0,0,0,0.05)] md:inset-x-auto md:bottom-3 md:right-3 md:top-3 md:max-h-none md:w-[360px]"
      aria-label="地点详情"
    >
      <div className="flex min-h-14 items-center gap-3 border-b border-border/50 px-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <HugeiconsIcon icon={Location04Icon} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold tracking-tight">{marker.name}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{marker.items.length} 条记录</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-8 text-muted-foreground hover:text-foreground"
          aria-label="关闭地点详情"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={17} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-card">
        <div className="flex flex-col [&_.memo-card]:rounded-none [&_.memo-card]:border-0 [&_.memo-card]:p-4 [&_.memo-card]:shadow-none">
          {marker.items.map((memo, index) => (
            <div key={memo.id} className={index > 0 ? "border-t border-border/40" : undefined}>
              <MemoCard
                memo={protectLockedMemo(unlockedMemosContext?.getUnlockedMemo(memo.id) ?? memo)}
                showOriginalOnly={false}
                showViewOriginal
              />
            </div>
          ))}
        </div>
      </div>
    </motion.aside>
  )
}
