"use client"

import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon as Loader2, Note02Icon } from "@hugeicons/core-free-icons"
import { PageEmptyState } from "@/shared/ui/PageEmptyState"

interface FeedStatusProps {
  isLoadingOlder: boolean
  hasMoreOlder: boolean
  memosCount: number
}

export function FeedStatus({ isLoadingOlder, hasMoreOlder, memosCount }: FeedStatusProps) {
  if (isLoadingOlder) {
    return (
      <div className="py-4 flex items-center justify-center min-h-[60px]">
        <div className="flex items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="flex items-center justify-center"
          >
            <HugeiconsIcon
              icon={Loader2}
              size={24}
              className="text-muted-foreground/50 transform-gpu will-change-transform"
            />
          </motion.div>
          <span className="ml-2 text-xs text-muted-foreground/60">加载更多...</span>
        </div>
      </div>
    )
  }

  if (!hasMoreOlder && memosCount > 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground/40 font-mono tracking-widest uppercase">
        --- The End ---
      </div>
    )
  }

  if (memosCount === 0) {
    return (
      <PageEmptyState
        icon={Note02Icon}
        title="暂无记录"
        description="写下第一条 Memo 后，它会在这里进入你的时间线。"
      />
    )
  }

  return <div className="h-[60px]" /> // Spacer
}
