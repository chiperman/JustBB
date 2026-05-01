"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Location04Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"
import { Memo } from "@/types/memo"
import { MemoCard } from "@/features/memos"

interface MapMemoPopupContentProps {
  title: string
  memos: Memo[]
  onClose: () => void
}

export function MapMemoPopupContent({
  title,
  memos,
  onClose,
}: MapMemoPopupContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 bg-background/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 text-primary font-bold">
          <HugeiconsIcon icon={Location04Icon} size={16} />
          <span className="text-sm truncate max-w-[200px]">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={18}
            className="text-muted-foreground/60"
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[420px]">
        <div className="flex flex-col">
          {memos.map((memo, idx) => (
            <div
              key={memo.id}
              className={cn(idx !== 0 && "border-t border-border/40")}
            >
              <MemoCard
                memo={memo}
                showOriginalOnly={false}
                showViewOriginal={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
