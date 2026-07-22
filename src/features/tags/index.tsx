"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Loading01Icon,
  PencilEdit01Icon,
  Search01Icon,
  Tag01Icon as TagIcon,
} from "@hugeicons/core-free-icons"

import { ContextPageHeader, ContextPageShell } from "@/shared/layout/ContextPageShell"
import { cn } from "@/shared/lib/utils"
import { PageEmptyState } from "@/shared/ui/PageEmptyState"

import { useTagGroups, TagData } from "./hooks/useTagGroups"
import { TagCard } from "./components/TagCard"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { useToast } from "@/shared/hooks/use-toast"
import { renameTagForCurrentUser } from "@/server/actions/memos/mutate"
import { dispatchMemoEvent } from "@/lib/memos/events"
import { useDelayedLoadingVisibility } from "@/shared/hooks/useDelayedLoadingVisibility"
import { TagsEmptyState } from "./components/TagsEmptyState"

interface TagsPageContentProps {
  tags?: TagData[]
}

const MIN_RENAME_PROGRESS_DISPLAY_MS = 1_200

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function TagsPageContent({ tags: initialTags }: TagsPageContentProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"count" | "name">("count")
  const { tags, isLoading, refreshTags } = useTagGroups(initialTags)
  const showInitialSkeleton = useDelayedLoadingVisibility(isLoading)
  const shouldReduceMotion = useReducedMotion()
  const canShowResolvedContent = !isLoading && !showInitialSkeleton
  const transitionDuration = shouldReduceMotion ? 0 : 0.2
  const [renameOpen, setRenameOpen] = useState(false)
  const [oldTag, setOldTag] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isConfirmingRename, setIsConfirmingRename] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameProgress, setRenameProgress] = useState(0)
  const { toast } = useToast()
  const affectedCount = tags.find((tag) => tag.tag_name === oldTag)?.count ?? 0
  const openRename = () => {
    setOldTag(tags[0]?.tag_name ?? "")
    setNewTag("")
    setIsConfirmingRename(false)
    setRenameProgress(0)
    setRenameOpen(true)
  }
  const requestRename = () => {
    const next = newTag.trim()
    if (!oldTag || !next || next === oldTag) return
    setIsConfirmingRename(true)
  }
  const confirmRename = async () => {
    const next = newTag.trim()
    const progressStartedAt = Date.now()
    setIsRenaming(true)
    setRenameProgress(0)
    const renameResult = renameTagForCurrentUser(oldTag, next)
    await delay(160)
    setRenameProgress(30)
    await delay(240)
    setRenameProgress(65)
    const result = await renameResult
    if (!result.success) {
      setIsConfirmingRename(false)
      setIsRenaming(false)
      setRenameProgress(0)
      toast({ title: "重命名失败", description: result.error, variant: "destructive" })
      return
    }
    setRenameProgress(100)
    const remainingDuration = MIN_RENAME_PROGRESS_DISPLAY_MS - (Date.now() - progressStartedAt)
    if (remainingDuration > 0) await delay(remainingDuration)
    await delay(240)
    setRenameOpen(false)
    setOldTag("")
    setNewTag("")
    setIsConfirmingRename(false)
    setIsRenaming(false)
    dispatchMemoEvent({ type: "update", id: "tags", updates: { tags: [] } })
    void refreshTags()
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
  const isEmpty = canShowResolvedContent && (tags.length === 0 || visibleTags.length === 0)

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
      {renameOpen && (
        <Dialog open onOpenChange={(open) => !open && !isRenaming && setRenameOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogTitle>重命名标签</DialogTitle>
            <DialogDescription>将标签名称同步更新到所属 Memo 的标签与正文。</DialogDescription>
            {isRenaming ? (
              <div className="space-y-5 py-8" role="status" aria-live="polite">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <HugeiconsIcon icon={Loading01Icon} size={28} className="animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">正在重命名标签...</p>
                    <p className="text-sm text-muted-foreground">
                      正在同步更新 {affectedCount} 条 Memo，请勿关闭页面。
                    </p>
                  </div>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={renameProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${renameProgress}%` }}
                  />
                </div>
              </div>
            ) : isConfirmingRename ? (
              <div className="space-y-5 pt-2">
                <p className="text-sm text-muted-foreground">
                  将把 <span className="font-medium text-foreground">#{oldTag}</span> 重命名为{" "}
                  <span className="font-medium text-foreground">#{newTag.trim()}</span>，并同步更新{" "}
                  {affectedCount} 条 Memo 的标签和正文。
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsConfirmingRename(false)}>
                    返回修改
                  </Button>
                  <Button onClick={confirmRename}>确认重命名</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <label className="block text-sm font-medium">
                  原标签
                  <Select value={oldTag} onValueChange={setOldTag}>
                    <SelectTrigger className="mt-2 w-full">
                      <SelectValue placeholder="选择标签" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      className="z-[97] h-64 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)]"
                      viewportClassName="h-full"
                    >
                      {tags.map((tag) => (
                        <SelectItem key={tag.tag_name} value={tag.tag_name}>
                          #{tag.tag_name}（{tag.count}）
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    onClick={requestRename}
                    disabled={!newTag.trim() || newTag.trim() === oldTag}
                  >
                    继续
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      <div className={isEmpty ? "flex flex-1 min-h-0 flex-col" : "space-y-8"}>
        <AnimatePresence mode="wait" initial={false}>
          {showInitialSkeleton ? (
            <motion.div
              key="tags-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: transitionDuration }}
              className="space-y-6"
            >
              <div className="h-4 w-20 rounded bg-muted/20 animate-pulse motion-reduce:animate-none" />
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div
                    key={item}
                    className="h-11 rounded-card border border-border/40 bg-muted/10 animate-pulse motion-reduce:animate-none"
                  />
                ))}
              </div>
            </motion.div>
          ) : isLoading ? (
            <div key="tags-pending" className="min-h-[280px]" aria-hidden="true" />
          ) : tags.length === 0 ? (
            <motion.div
              key="tags-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: transitionDuration }}
              className="flex flex-1"
            >
              <TagsEmptyState />
            </motion.div>
          ) : visibleTags.length === 0 ? (
            <motion.div
              key="tags-no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: transitionDuration }}
              className="flex flex-1"
            >
              <PageEmptyState
                icon={Search01Icon}
                title="没有找到匹配的标签"
                description={`没有找到匹配 “${query.trim()}” 的标签。`}
              />
            </motion.div>
          ) : (
            <motion.section
              key="tags-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: transitionDuration }}
              className="space-y-4"
            >
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
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </ContextPageShell>
  )
}
