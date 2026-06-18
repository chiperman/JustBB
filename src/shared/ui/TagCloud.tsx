"use client"

import { memo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"

import { useTags } from "@/state/TagsContext"
import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/shared/ui/skeleton"

export const TagCloud = memo(function TagCloud() {
  const { tags, isLoading, isMounted } = useTags()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentTag = searchParams.get("tag")

  const topTags = useMemo(() => {
    return [...tags].sort((a, b) => b.count - a.count).slice(0, 6)
  }, [tags])

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams)
    const currentTag = params.get("tag")
    if (currentTag === tag) {
      params.delete("tag") // 再次点击取消过滤
    } else {
      params.set("tag", tag)
    }
    router.push(`/?${params.toString()}`)
  }

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>, tag: string) => {
    if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault()
      handleTagClick(tag)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {(!isMounted && tags.length === 0) || (isLoading && tags.length === 0) ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-wrap gap-2"
        >
          <Skeleton className="h-6 w-12 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-10 rounded-md" />
          <Skeleton className="h-6 w-14 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
          <Skeleton className="h-6 w-8 rounded-md" />
        </motion.div>
      ) : topTags.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="text-xs text-muted-foreground/50 py-2"
        >
          暂无标签
        </motion.div>
      ) : (
        <motion.div
          key="content"
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-wrap gap-2"
        >
          {topTags.map(({ tag_name, count }) => {
            const isActive = currentTag === tag_name
            return (
              <Badge
                key={tag_name}
                variant={isActive ? "default" : "secondary"}
                onClick={() => handleTagClick(tag_name)}
                onKeyDown={(event) => handleTagKeyDown(event, tag_name)}
                className={cn(
                  "px-2 py-0.5 nav-button-text font-medium gap-1.5 transition-all active:scale-95 outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive
                    ? ""
                    : "border-border/50 bg-background text-muted-foreground hover:bg-accent"
                )}
                aria-label={`标签 #${tag_name}，共有 ${count} 条记录`}
                aria-pressed={isActive}
                role="button"
                tabIndex={0}
              >
                <span aria-hidden="true">#{tag_name}</span>
                <span
                  className={cn(
                    "text-[10px] opacity-60",
                    isActive ? "text-primary-foreground" : "text-stone-400"
                  )}
                  aria-hidden="true"
                >
                  {count}
                </span>
              </Badge>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
})
