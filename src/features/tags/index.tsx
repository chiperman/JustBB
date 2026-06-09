"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Search01Icon,
  Tag01Icon as TagIcon,
} from "@hugeicons/core-free-icons"

import {
  ContextPageHeader,
  ContextPageShell,
} from "@/shared/layout/ContextPageShell"
import { cn } from "@/shared/lib/utils"

import { useTagGroups, TagData } from "./hooks/useTagGroups"
import { TagCard } from "./components/TagCard"

interface TagsPageContentProps {
  tags?: TagData[]
}

export function TagsPageContent({ tags: initialTags }: TagsPageContentProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"count" | "name">("count")
  const { tags, isLoading } = useTagGroups(initialTags)

  // 1. 获取全局最大计数，用于计算标准卡片百分比占比条
  const maxCount = useMemo(
    () => (tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 0),
    [tags]
  )

  // 2. 按所选规则排序的全部标签列表
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      if (sortBy === "count") {
        return b.count - a.count || a.tag_name.localeCompare(b.tag_name, "zh")
      }
      return a.tag_name.localeCompare(b.tag_name, "zh")
    })
  }, [tags, sortBy])

  // 3. 根据筛选词进行过滤的标签
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTags = useMemo(() => {
    if (!normalizedQuery) return sortedTags
    return sortedTags.filter((tag) =>
      tag.tag_name.toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery, sortedTags])

  return (
    <ContextPageShell
      header={
        <ContextPageHeader
          icon={TagIcon}
          title="标签"
          actions={
            <div className="flex items-center gap-3">
              {/* 排序切换 Tabs */}
              <div className="flex items-center rounded-lg bg-secondary/80 p-0.5 whisper-border">
                <button
                  type="button"
                  onClick={() => setSortBy("count")}
                  className={cn(
                    "rounded-[6px] px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                    sortBy === "count"
                      ? "bg-card text-foreground shadow-[0_1px_2px_rgba(29,29,27,0.05)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  按频次
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("name")}
                  className={cn(
                    "rounded-[6px] px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                    sortBy === "name"
                      ? "bg-card text-foreground shadow-[0_1px_2px_rgba(29,29,27,0.05)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  按名称
                </button>
              </div>

              {/* 搜索过滤框 */}
              <div className="relative w-36 sm:w-48">
                <div className="relative flex items-center min-h-[32px] bg-background/50 border border-border rounded-md px-2.5 transition-all hover:bg-background/80 focus-within:border-primary/30">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={14}
                    className={cn(
                      "shrink-0 transition-colors mr-1.5",
                      query.trim()
                        ? "text-primary/70"
                        : "text-muted-foreground/45"
                    )}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="筛选..."
                    className="flex-1 min-w-0 bg-transparent border-none outline-none ring-0 p-0 h-full text-xs text-foreground placeholder:text-muted-foreground/40"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="shrink-0 ml-1 p-0.5 text-muted-foreground/30 hover:text-muted-foreground transition-colors active:scale-90"
                      title="清空筛选"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          }
        />
      }
    >
      <div className="space-y-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-4 w-20 rounded bg-muted/20 animate-pulse" />
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="h-11 rounded-card border border-border/40 bg-muted/10 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : tags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              暂无标签记录。写下第一条带标签的 Memo 之后，这里会自动形成索引。
            </p>
          </div>
        ) : visibleTags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              没有找到匹配 “{query.trim()}” 的标签。
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {normalizedQuery ? "搜索结果" : "全部标签"}
              </span>
              <span className="text-xs text-muted-foreground/40 font-mono">
                ({visibleTags.length})
              </span>
              <div className="h-px flex-1 bg-border/20" />
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {visibleTags.map((tag) => (
                <TagCard key={tag.tag_name} tag={tag} maxCount={maxCount} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ContextPageShell>
  )
}
