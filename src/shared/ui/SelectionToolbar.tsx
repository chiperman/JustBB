"use client"

import { useState } from "react"
import { useSelection } from "@/state/UIContext"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon as Trash2,
  Tag01Icon as Tag,
  Cancel01Icon as X,
  ArrowTurnBackwardIcon as RotateCcw,
  ArchiveRestore as ArchiveRestore,
  Loading01Icon as Loader2,
  AlertCircleIcon as ShieldAlert,
} from "@hugeicons/core-free-icons"
import { useToast } from "@/shared/hooks/use-toast"
import {
  batchDeleteMemos,
  batchRestoreMemos,
  batchPermanentDeleteMemos,
} from "@/server/actions/memos/trash"
import { batchAddTagsToMemos } from "@/server/actions/memos/mutate"
import { TagSelectDialog, TagState } from "./TagSelectDialog"
import { useTags } from "@/state/TagsContext"
import { useStats } from "@/state/StatsContext"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { BaseFloatingCapsule } from "./BaseFloatingCapsule"
import { useConfirm } from "@/state/ConfirmContext"
import { dispatchMemoEvent } from "@/lib/memos/events"
import { ShortcutHint } from "@/shared/shortcuts/ShortcutHint"

export function SelectionToolbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSelectionMode, selectedIds, clearSelection, toggleSelectionMode, getSelectedMemos } =
    useSelection()
  const { refreshTags } = useTags()
  const { refreshStats } = useStats()
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const hasMounted = useHasMounted()

  const isTrashPage = pathname === "/trash"
  const hasSelection = selectedIds.size > 0

  if (!hasMounted || !isSelectionMode) return null

  const handleBatchDelete = async () => {
    if (!hasSelection) return
    const ok = await confirm({
      title: "移至回收站？",
      description: `将选中的 ${selectedIds.size} 条笔记移至回收站？`,
      confirmLabel: "删除",
      variant: "destructive",
    })
    if (!ok) return

    setIsPending(true)
    try {
      const res = await batchDeleteMemos(Array.from(selectedIds))
      if (res.success) {
        toast({
          title: "已批量删除",
          description: `成功删除 ${selectedIds.size} 条笔记`,
        })
        Array.from(selectedIds).forEach((id) => {
          dispatchMemoEvent({ type: "delete", id })
        })
        clearSelection()
        refreshTags()
        refreshStats()
        router.refresh()
      } else {
        toast({
          title: "删除失败",
          description: res.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  const handleBatchRestore = async () => {
    if (!hasSelection) return

    setIsPending(true)
    try {
      const res = await batchRestoreMemos(Array.from(selectedIds))
      if (res.success) {
        toast({
          title: "已恢复",
          description: `成功恢复 ${selectedIds.size} 条笔记`,
        })
        Array.from(selectedIds).forEach((id) => {
          dispatchMemoEvent({ type: "delete", id })
        })
        clearSelection()
        refreshTags()
        refreshStats()
        router.refresh()
      } else {
        toast({
          title: "操作失败",
          description: res.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  const handleBatchPermanentDelete = async () => {
    if (!hasSelection) return
    const ok = await confirm({
      title: "彻底删除？",
      description: `彻底删除选中的 ${selectedIds.size} 条笔记？此操作不可恢复。`,
      confirmLabel: "彻底删除",
      variant: "destructive",
    })
    if (!ok) return

    setIsPending(true)
    try {
      const res = await batchPermanentDeleteMemos(Array.from(selectedIds))
      if (res.success) {
        toast({
          title: "已彻底删除",
          description: `成功删除 ${selectedIds.size} 条笔记`,
          variant: "destructive",
        })
        Array.from(selectedIds).forEach((id) => {
          dispatchMemoEvent({ type: "delete", id })
        })
        clearSelection()
        refreshTags()
        refreshStats()
        router.refresh()
      } else {
        toast({
          title: "操作失败",
          description: res.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  const getInitialTagStates = () => {
    const selectedMemos = getSelectedMemos()
    const N = selectedMemos.length
    if (N === 0) return {}

    const tagCounts: Record<string, number> = {}
    selectedMemos.forEach((memo) => {
      const memoTags = memo.tags || []
      memoTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    const initialStates: Record<string, TagState> = {}
    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count === N) {
        initialStates[tag] = "checked"
      } else if (count > 0) {
        initialStates[tag] = "indeterminate"
      }
    })
    return initialStates
  }

  const handleBatchManageTags = async (addTags: string[], removeTags: string[]) => {
    const formData = new FormData()
    formData.append("ids", Array.from(selectedIds).join(","))
    formData.append("tags", addTags.join(","))
    formData.append("removeTags", removeTags.join(","))

    setIsPending(true)
    try {
      const res = await batchAddTagsToMemos(formData)
      if (res.success) {
        toast({
          title: "已更新标签",
          description: `成功修改了 ${selectedIds.size} 条笔记的标签`,
        })
        if (res.data) {
          res.data.forEach((updatedMemo) => {
            dispatchMemoEvent({
              type: "update",
              id: updatedMemo.id,
              updates: {
                tags: updatedMemo.tags,
                content: updatedMemo.content,
                word_count: updatedMemo.word_count,
                locations: updatedMemo.locations,
                updated_at: updatedMemo.updated_at,
              },
            })
          })
        }
        clearSelection()
        refreshTags()
        refreshStats()
        router.refresh()
      } else {
        toast({
          title: "更新失败",
          description: res.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsPending(false)
      setIsTagDialogOpen(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isSelectionMode && (
          <BaseFloatingCapsule className="absolute w-auto">
            <div className="flex items-center gap-1.5 flex-1 px-1">
              {isTrashPage ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBatchRestore}
                    disabled={!hasSelection || isPending}
                    className="h-8 px-3 gap-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-md active:scale-95 transition-all"
                  >
                    <HugeiconsIcon icon={ArchiveRestore} size={14} />
                    <span>恢复</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBatchPermanentDelete}
                    disabled={!hasSelection || isPending}
                    className="h-8 px-3 gap-1.5 text-xs font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-md active:scale-95 transition-all"
                  >
                    <HugeiconsIcon icon={ShieldAlert} size={14} />
                    <span>彻底删除</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTagDialogOpen(true)}
                    disabled={!hasSelection || isPending}
                    className="h-8 px-3 gap-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-md active:scale-95 transition-all"
                  >
                    <HugeiconsIcon icon={Tag} size={14} />
                    <span>添加标签</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={!hasSelection || isPending}
                    className="h-8 px-3 gap-1.5 text-xs font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-md active:scale-95 transition-all"
                  >
                    {isPending ? (
                      <HugeiconsIcon icon={Loader2} size={14} className="animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={Trash2} size={14} />
                    )}
                    <span>删除</span>
                  </Button>
                </>
              )}
            </div>

            <div className="w-px h-3.5 bg-border mx-1" />

            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    disabled={!hasSelection || isPending}
                    className="h-8 w-8 p-0 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted rounded-md active:scale-95 transition-all"
                    aria-label="重置选择"
                  >
                    <HugeiconsIcon icon={RotateCcw} size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex items-center gap-2">
                  <span>重置选择</span>
                </TooltipContent>
              </Tooltip>
              {!isTrashPage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSelectionMode(false)}
                      className="h-8 w-8 p-0 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted rounded-md active:scale-95 transition-all"
                    >
                      <HugeiconsIcon icon={X} size={15} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="flex items-center gap-2">
                    <span>退出选择</span>
                    <ShortcutHint shortcut="mod+shift+x" />
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </BaseFloatingCapsule>
        )}
      </AnimatePresence>

      {!isTrashPage && (
        <TagSelectDialog
          isOpen={isTagDialogOpen}
          onClose={() => setIsTagDialogOpen(false)}
          initialTagStates={getInitialTagStates()}
          onConfirm={handleBatchManageTags}
        />
      )}
    </>
  )
}
