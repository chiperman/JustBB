"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Archive02Icon as Archive,
} from "@hugeicons/core-free-icons"

import { Button } from "@/shared/ui/button"

export function TrashEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/80">
        <HugeiconsIcon icon={Archive} size={24} className="text-primary/60" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          回收站现在是空的
        </h2>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          新删除的 Memo
          会先来到这里。你可以稍后回来恢复它们，或者继续回到首页写新的记录。
        </p>
      </div>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-6 border-border/60 bg-background/80-none"
      >
        <Link href="/">
          返回首页
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      </Button>
    </motion.div>
  )
}
