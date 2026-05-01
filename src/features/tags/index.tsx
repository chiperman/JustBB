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

import { useTagGroups, TagData, groupTagsByInitial } from "./hooks/useTagGroups"
import { TagCard } from "./components/TagCard"

interface TagsPageContentProps {
  tags?: TagData[]
}

export function TagsPageContent({ tags: initialTags }: TagsPageContentProps) {
  const [query, setQuery] = useState("")
  const { tags, isLoading } = useTagGroups(initialTags)

  const sortedTags = useMemo(
    () =>
      [...tags].sort(
        (a, b) => b.count - a.count || a.tag_name.localeCompare(b.tag_name)
      ),
    [tags]
  )
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTags = useMemo(
    () =>
      !normalizedQuery
        ? sortedTags
        : sortedTags.filter((tag) =>
            tag.tag_name.toLowerCase().includes(normalizedQuery)
          ),
    [normalizedQuery, sortedTags]
  )
  const { groupedTags, groups } = useMemo(
    () => groupTagsByInitial(visibleTags),
    [visibleTags]
  )

  return (
    <ContextPageShell
      header={
        <ContextPageHeader
          icon={TagIcon}
          title="标签"
          showTitle={false}
          description={
            tags.length > 0
              ? `共 ${tags.length} 个标签，点开后直接进入首页过滤结果。`
              : "写下带标签的 Memo 后，这里会自动生成索引。"
          }
          actions={
            <div className="w-full max-w-sm">
              <div className="relative w-full group">
                <div className="relative flex items-center min-h-[36px] bg-background/50 border border-border rounded-md px-2 transition-all hover:bg-background/80 focus-within:border-primary/30">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-8 py-1.5">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      className={cn(
                        "shrink-0 ml-1 transition-colors",
                        query.trim()
                          ? "text-primary/70"
                          : "text-muted-foreground/50"
                      )}
                    />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="筛选标签..."
                      className="flex-1 min-w-[60px] bg-transparent border-none outline-none ring-0 p-0 h-full text-sm text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>

                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="shrink-0 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors active:scale-90"
                      title="清空筛选"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
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
          <div className="space-y-8">
            {["A", "B", "C"].map((group) => (
              <div
                key={group}
                className="grid grid-cols-1 gap-4 sm:grid-cols-[56px_1fr]"
              >
                <div className="h-4 w-10 rounded bg-muted/20 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-5 w-32 rounded bg-muted/20 animate-pulse" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-12 rounded-card border border-border/40 bg-muted/20 animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
          <section className="space-y-8">
            {groups.map((group) => (
              <div
                key={group}
                className="grid grid-cols-1 gap-4 sm:grid-cols-[56px_1fr]"
              >
                <div className="pt-0.5 text-sm font-semibold tracking-tight text-muted-foreground/70">
                  {group}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium tracking-tight text-foreground">
                      {group === "#" ? "其他标签" : `${group} 组`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {groupedTags[group].length} 个标签
                    </div>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>

                  <div className={cn("grid gap-3 sm:grid-cols-2")}>
                    {groupedTags[group].map((tag) => (
                      <TagCard key={tag.tag_name} tag={tag} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </ContextPageShell>
  )
}
