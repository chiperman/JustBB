"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinIcon,
  ChatLock01Icon as LockIcon,
  Link02Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { cn, formatDate } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { MemoActions } from "../MemoActions"
import { Memo } from "@/types/memo"

interface MemoCardHeaderProps {
  memo: Memo
  isSelectionMode: boolean
  isSelected: boolean
  onToggleSelection: () => void
  showOriginalOnly: boolean
  showBacklinks: boolean
  onToggleBacklinks: () => void
  onEdit: () => void
  onMenuOpenChange: (open: boolean) => void
  isMenuOpen: boolean
  hasMounted: boolean
  showViewOriginal?: boolean
}

export function MemoCardHeader({
  memo,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  showOriginalOnly,
  showBacklinks,
  onToggleBacklinks,
  onEdit,
  onMenuOpenChange,
  isMenuOpen,
  hasMounted,
  showViewOriginal,
}: MemoCardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 min-h-[32px]">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "absolute top-[26px] -translate-y-1/2 flex items-center justify-center z-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isSelectionMode
              ? "opacity-100 scale-100 pointer-events-auto -left-6 sm:-left-8"
              : "opacity-0 scale-75 pointer-events-none -left-9 sm:-left-11"
          )}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onToggleSelection()
          }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="h-4 w-4 rounded-[4px] border-border bg-background transition-all data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>
        <span className="badge-text bg-[#fdf5f2] px-2 py-0.5 rounded-sm">#{memo.memo_number}</span>
        <time className="caption tracking-tight">
          {hasMounted
            ? memo.is_locked
              ? `${formatDate(memo.created_at, "yyyy-MM-dd HH:mm")} **:**`
              : formatDate(memo.created_at, "yyyy-MM-dd HH:mm")
            : "--:--"}
        </time>
        {memo.is_pinned && (
          <HugeiconsIcon
            icon={PinIcon}
            size={14}
            className="text-primary fill-current"
            aria-hidden="true"
          />
        )}
        {memo.is_private && (
          <HugeiconsIcon
            icon={LockIcon}
            size={14}
            className="text-muted-foreground"
            aria-hidden="true"
          />
        )}
        {memo.word_count !== undefined && (
          <span className="text-[10px] caption opacity-60">
            {memo.is_locked ? "*" : memo.word_count} 字
          </span>
        )}
      </div>
      <div
        className={cn(
          "flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isSelectionMode
            ? "opacity-0 scale-95 pointer-events-none translate-x-2 invisible"
            : "opacity-100 scale-100 pointer-events-auto translate-x-0 visible"
        )}
      >
        {memo.is_locked ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 rounded-md text-muted-foreground/35 opacity-100"
              aria-label="私密记录解锁后可查看引用"
              title="私密记录解锁后可查看引用"
            >
              <HugeiconsIcon icon={Link02Icon} size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 rounded-md text-muted-foreground/35 opacity-100"
              aria-label="私密记录解锁后可使用更多操作"
              title="私密记录解锁后可使用更多操作"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
            </Button>
          </>
        ) : showOriginalOnly || showViewOriginal ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              window.location.assign(`/?num=${memo.memo_number}`)
            }}
            className={cn(
              "h-7 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-all z-10 pointer-events-auto",
              !showViewOriginal && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            )}
          >
            查看原文
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleBacklinks}
              className={cn(
                "h-8 w-8 rounded-md transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:scale-95",
                showBacklinks ? "bg-primary/10 text-primary opacity-100" : "text-muted-foreground",
                (showBacklinks || isMenuOpen) && "opacity-100"
              )}
              aria-expanded={showBacklinks}
              aria-label="查看引用"
              title="查看引用"
            >
              <HugeiconsIcon icon={Link02Icon} size={16} />
            </Button>
            <MemoActions
              id={memo.id}
              isDeleted={!!memo.deleted_at}
              isPinned={memo.is_pinned}
              isPrivate={memo.is_private}
              content={memo.content}
              createdAt={memo.created_at}
              tags={memo.tags ?? []}
              onEdit={onEdit}
              onOpenChange={onMenuOpenChange}
              isOwner={memo.is_owner}
            />
          </>
        )}
      </div>
    </div>
  )
}
