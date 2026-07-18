"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon, Tag01Icon as TagIcon } from "@hugeicons/core-free-icons"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"

import { ContextPageHeader, ContextPageShell } from "@/shared/layout/ContextPageShell"
import { cn } from "@/shared/lib/utils"
import { PageEmptyState } from "@/shared/ui/PageEmptyState"

import { useTagGroups, TagData } from "./hooks/useTagGroups"
import { TagCard } from "./components/TagCard"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { useConfirm } from "@/state/ConfirmContext"
import { useToast } from "@/shared/hooks/use-toast"
import { renameTagForCurrentUser } from "@/server/actions/memos/mutate"
import { dispatchMemoEvent } from "@/lib/memos/events"

interface TagsPageContentProps {
  tags?: TagData[]
}

export function TagsPageContent({ tags: initialTags }: TagsPageContentProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"count" | "name">("count")
  const { tags, isLoading, refreshTags } = useTagGroups(initialTags)
  const [renameOpen, setRenameOpen] = useState(false)
  const [oldTag, setOldTag] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const affectedCount = tags.find((tag) => tag.tag_name === oldTag)?.count ?? 0
  const openRename = () => {
    setOldTag(tags[0]?.tag_name ?? "")
    setNewTag("")
    setRenameOpen(true)
  }
  const submitRename = async () => {
    const next = newTag.trim()
    if (!oldTag || !next || next === oldTag) return
    if (
      !(await confirm({
        title: "重命名标签？",
        description: `将同步更新 ${affectedCount} 条 Memo 的标签和正文。`,
        confirmLabel: "确认重命名",
      }))
    )
      return
    setIsRenaming(true)
    const result = await renameTagForCurrentUser(oldTag, next)
    setIsRenaming(false)
    if (!result.success) {
      toast({ title: "重命名失败", description: result.error, variant: "destructive" })
      return
    }
    dispatchMemoEvent({ type: "update", id: "tags", updates: { tags: [] } })
    await refreshTags()
    setRenameOpen(false)
    toast({
      title: "标签已重命名",
      description: `已更新 ${result.data?.count ?? 0} 条 Memo`,
      variant: "success",
    })
  }

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
    return sortedTags.filter((tag) => tag.tag_name.toLowerCase().includes(normalizedQuery))
  }, [normalizedQuery, sortedTags])
  const isEmpty = !isLoading && (tags.length === 0 || visibleTags.length === 0)

  return (
    <ContextPageShell
      scrollable={!isEmpty}
      maxWidthClassName={isEmpty ? "max-w-screen-xl h-full flex flex-col min-h-0" : undefined}
      contentClassName={isEmpty ? "flex-1 h-full min-h-0 pt-4 pb-6 flex flex-col" : undefined}
      header={
        <ContextPageHeader
          icon={TagIcon}
          title="标签"
          actions={
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={openRename}
                disabled={tags.length === 0}
                className="shrink-0"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={14} /> 重命名
              </Button>
              {/* 排序切换 Tabs */}
              <div className="flex items-center rounded-md bg-secondary/80 p-0.5 whisper-border relative">
                <button
                  type="button"
                  onClick={() => setSortBy("count")}
                  className={cn(
                    "relative z-10 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-transparent",
                    sortBy === "count"
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sortBy === "count" && (
                    <motion.div
                      layoutId="tags-active-sort-tab"
                      className="absolute inset-0 bg-card rounded-[6px] shadow-[0_1px_2px_rgba(29,29,27,0.05)] whisper-border"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                    />
                  )}
                  <span className="relative z-10">按频次</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("name")}
                  className={cn(
                    "relative z-10 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-transparent",
                    sortBy === "name"
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sortBy === "name" && (
                    <motion.div
                      layoutId="tags-active-sort-tab"
                      className="absolute inset-0 bg-card rounded-[6px] shadow-[0_1px_2px_rgba(29,29,27,0.05)] whisper-border"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                    />
                  )}
                  <span className="relative z-10">按名称</span>
                </button>
              </div>

              {/* 搜索过滤框 */}
              <div className="relative flex-1 sm:flex-initial w-auto sm:w-48 min-w-[120px]">
                <div className="relative flex items-center min-h-[36px] bg-background border border-border rounded-md px-2 focus-within:border-primary/30 transition-all hover:bg-secondary/50 group">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 py-1.5">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      className={cn(
                        "shrink-0 ml-1 transition-colors",
                        query.trim() ? "text-primary/70" : "text-muted-foreground/50"
                      )}
                    />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="筛选..."
                      className="flex-1 min-w-0 bg-transparent border-none outline-none ring-0 p-0 h-full text-sm text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="shrink-0 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors [@media(pointer:coarse)]:active:scale-90 outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>重命名标签</DialogTitle>
          <div className="space-y-4 pt-2">
            <label className="block text-sm font-medium">
              原标签
              <select
                value={oldTag}
                onChange={(e) => setOldTag(e.target.value)}
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {tags.map((tag) => (
                  <option key={tag.tag_name} value={tag.tag_name}>
                    #{tag.tag_name}（{tag.count}）
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              新标签
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入新标签名称"
                className="mt-2"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              将影响 {affectedCount} 条 Memo，并同步更新正文中的完整标签。
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRenameOpen(false)}>
                取消
              </Button>
              <Button
                onClick={submitRename}
                disabled={isRenaming || !newTag.trim() || newTag.trim() === oldTag}
              >
                {isRenaming ? "正在重命名…" : "重命名"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className={isEmpty ? "flex flex-1 min-h-0 flex-col" : "space-y-8"}>
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
          <PageEmptyState
            icon={TagIcon}
            title="暂无标签"
            description="写下第一条带标签的 Memo 之后，这里会自动形成索引。"
          />
        ) : visibleTags.length === 0 ? (
          <PageEmptyState
            icon={Search01Icon}
            title="没有找到匹配的标签"
            description={`没有找到匹配 “${query.trim()}” 的标签。`}
          />
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
