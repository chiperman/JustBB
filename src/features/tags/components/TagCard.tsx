"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tag01Icon as TagIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"
import { TagData } from "../hooks/useTagGroups"

interface TagCardProps {
  tag: TagData
  maxCount?: number
  isFeatured?: boolean
}

export function TagCard({ tag, maxCount, isFeatured = false }: TagCardProps) {
  const percentage = maxCount && maxCount > 0 ? (tag.count / maxCount) * 100 : 0

  return (
    <Link
      href={`/?tag=${encodeURIComponent(tag.tag_name)}`}
      className={cn(
        "group relative z-10 flex items-center justify-between rounded-md border transition-all overflow-hidden",
        isFeatured
          ? "border-primary/20 bg-(--badge-clay-bg) px-5 py-4 hover:border-primary [@media(pointer:coarse)]:active:scale-[0.98]"
          : "border-border bg-card px-4 py-3 hover:border-primary/30 hover:bg-accent/20 [@media(pointer:coarse)]:active:scale-[0.98]"
      )}
    >
      {/* 占比背景指示条（仅非热门卡片显示，热门卡片本身已有主题色背景） */}
      {!isFeatured && percentage > 0 && (
        <div
          className="absolute inset-y-0 left-0 -z-10 bg-primary/5 dark:bg-primary/10 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      )}

      <div className="flex min-w-0 items-center gap-2">
        <HugeiconsIcon
          icon={TagIcon}
          size={isFeatured ? 16 : 14}
          className={cn(
            "shrink-0 transition-colors",
            isFeatured
              ? "text-primary/80 group-hover:text-primary"
              : "text-muted-foreground/60 group-hover:text-primary/70"
          )}
        />
        <span
          className={cn(
            "truncate tracking-tight transition-colors",
            isFeatured
              ? "text-base font-semibold text-primary group-hover:text-primary"
              : "text-sm font-medium text-foreground group-hover:text-primary"
          )}
        >
          #{tag.tag_name}
        </span>
      </div>

      <span
        className={cn(
          "shrink-0 font-mono tabular-nums",
          isFeatured ? "text-sm font-semibold text-primary/80" : "text-xs text-muted-foreground"
        )}
      >
        {tag.count.toString().padStart(2, "0")}
      </span>
    </Link>
  )
}
