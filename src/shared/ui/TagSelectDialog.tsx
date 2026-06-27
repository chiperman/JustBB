"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useTags } from "@/state/TagsContext"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tag01Icon as Tag,
  Add01Icon as Plus,
  Loading01Icon as Loader2,
  Search01Icon as Search,
} from "@hugeicons/core-free-icons"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { cn } from "@/shared/lib/utils"

export type TagState = "checked" | "unchecked" | "indeterminate"

interface TagSelectDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTagStates: Record<string, TagState>
  onConfirm: (addTags: string[], removeTags: string[]) => void
}

function ThreeStateCheckbox({ state }: { state: TagState }) {
  return (
    <div
      className={cn(
        "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
        state === "checked" && "bg-primary border-primary text-primary-foreground",
        state === "indeterminate" && "bg-primary/10 border-primary/30 text-primary",
        state === "unchecked" && "border-border/60 bg-background"
      )}
    >
      {state === "checked" && (
        <span className="block h-[7px] w-[3.5px] -translate-y-[0.5px] rotate-45 border-r-[1.5px] border-b-[1.5px] border-white" />
      )}
      {state === "indeterminate" && <span className="block h-[1.5px] w-[7px] bg-primary" />}
    </div>
  )
}

export function TagSelectDialog({
  isOpen,
  onClose,
  initialTagStates,
  onConfirm,
}: TagSelectDialogProps) {
  const { tags: allTags, isLoading } = useTags()
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({})
  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasMounted = useHasMounted()

  useEffect(() => {
    if (isOpen) {
      setTagStates(initialTagStates)
      setInputValue("")
    }
  }, [isOpen, initialTagStates])

  if (!hasMounted) return null

  const toggleTag = (tagName: string) => {
    setTagStates((prev) => {
      const current = prev[tagName] ?? "unchecked"
      let next: TagState
      if (current === "checked") {
        next = "unchecked"
      } else if (current === "indeterminate") {
        next = "checked"
      } else {
        next = "checked"
      }
      return {
        ...prev,
        [tagName]: next,
      }
    })
  }

  const handleAddCustomTag = () => {
    const tag = inputValue.trim()
    if (tag) {
      setTagStates((prev) => {
        if (prev[tag] === "checked") return prev
        return {
          ...prev,
          [tag]: "checked",
        }
      })
      setInputValue("")
    }
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const addTags: string[] = []
      const removeTags: string[] = []

      const allKeys = new Set([...Object.keys(initialTagStates), ...Object.keys(tagStates)])

      allKeys.forEach((key) => {
        const initial = initialTagStates[key] ?? "unchecked"
        const current = tagStates[key] ?? "unchecked"

        if (initial !== current) {
          if (current === "checked") {
            addTags.push(key)
          } else if (current === "unchecked") {
            removeTags.push(key)
          }
        }
      })

      if (addTags.length > 0 || removeTags.length > 0) {
        await onConfirm(addTags, removeTags)
      }
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = () => {
    const allKeys = new Set([...Object.keys(initialTagStates), ...Object.keys(tagStates)])
    for (const key of allKeys) {
      if ((initialTagStates[key] ?? "unchecked") !== (tagStates[key] ?? "unchecked")) {
        return true
      }
    }
    return false
  }

  // 合并推荐/现有标签与用户当前所选择/修改的标签
  const uniqueTagNames = Array.from(
    new Set([...allTags.map((t) => t.tag_name), ...Object.keys(tagStates)])
  )

  const displayTags = uniqueTagNames.map((tagName) => {
    const dbTag = allTags.find((t) => t.tag_name === tagName)
    return {
      tagName,
      count: dbTag?.count ?? 0,
      state: tagStates[tagName] ?? "unchecked",
    }
  })

  const filteredTags = displayTags.filter((t) =>
    t.tagName.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-md border-border/40 bg-card/95 p-4 backdrop-blur-md sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <HugeiconsIcon icon={Tag} size={20} className="text-primary" />
            管理标签
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 sm:py-4">
          {/* 搜索与输入 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search}
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomTag()}
                placeholder="搜索或新建标签..."
                className="pl-9 h-9 rounded-md bg-background border-border/40 focus-visible:ring-primary/20"
              />
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddCustomTag}
              disabled={!inputValue.trim()}
              className="h-9 px-3 rounded-md active:scale-95 transition-all"
            >
              <HugeiconsIcon icon={Plus} size={16} />
            </Button>
          </div>

          {/* 标签选择列表 */}
          <div className="max-h-[min(42dvh,240px)] overflow-y-auto scrollbar-hide border border-border/20 rounded-md divide-y divide-border/10 bg-background/50 sm:max-h-[240px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <HugeiconsIcon
                  icon={Loader2}
                  size={24}
                  className="animate-spin text-muted-foreground/40"
                />
              </div>
            ) : filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <div
                  key={tag.tagName}
                  onClick={() => toggleTag(tag.tagName)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 cursor-pointer transition-all active:bg-accent/70 select-none group"
                >
                  <ThreeStateCheckbox state={tag.state} />
                  <span className="text-xs text-foreground font-medium flex-1">#{tag.tagName}</span>
                  {tag.count > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground/60 px-1.5 py-0.5 rounded-full bg-accent/25 group-hover:bg-accent/50 transition-all">
                      {tag.count}
                    </span>
                  )}
                </div>
              ))
            ) : inputValue ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic">
                按回车键或点击右侧按钮新建标签 &quot;{inputValue}&quot;
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground italic">暂无标签</div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 [&>button]:w-full sm:[&>button]:w-auto">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-md active:scale-95 transition-all text-xs h-9"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasChanges() || isSubmitting}
            className="rounded-md active:scale-95 transition-all text-xs h-9 px-4"
          >
            {isSubmitting && (
              <HugeiconsIcon icon={Loader2} size={16} className="animate-spin mr-2" />
            )}
            保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
