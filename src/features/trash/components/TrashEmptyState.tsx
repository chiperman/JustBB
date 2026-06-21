"use client"

import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"

export function TrashEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center"
    >
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border/50 bg-background/70">
        <HugeiconsIcon icon={Delete02Icon} size={18} className="text-muted-foreground/60" />
      </div>

      <p className="text-sm text-muted-foreground">
        暂无回收记录。删除后的 Memo 会暂存在这里，方便之后恢复或彻底清理。
      </p>
    </motion.div>
  )
}
