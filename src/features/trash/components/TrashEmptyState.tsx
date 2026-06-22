"use client"

import { motion } from "framer-motion"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { PageEmptyState } from "@/shared/ui/PageEmptyState"

export function TrashEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1"
    >
      <PageEmptyState
        icon={Delete02Icon}
        title="暂无回收记录"
        description="删除后的 Memo 会暂存在这里，方便之后恢复或彻底清理。"
      />
    </motion.div>
  )
}
