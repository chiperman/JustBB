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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
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
        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            aria-label={`选择 Memo #${memo.memo_number}`}
            className="h-4 w-4 rounded-[4px] border-border bg-background transition-all data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        )}
        <span className="rounded-md bg-(--badge-clay-bg) px-1.5 py-0.5 text-[0.75rem] font-semibold leading-[1.33] tracking-[0.125px] text-(--badge-clay-text)">
          #{memo.memo_number}
        </span>
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
          isSelectionMode && !memo.deleted_at
            ? "opacity-0 scale-95 pointer-events-none translate-x-2 invisible"
            : "opacity-100 scale-100 pointer-events-auto translate-x-0 visible"
        )}
      >
        {memo.is_locked ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="h-8 w-8 rounded-md text-muted-foreground/35 opacity-100 pointer-events-none"
                    aria-label="私密记录解锁后可查看引用"
                  >
                    <HugeiconsIcon icon={Link02Icon} size={16} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">私密记录解锁后可查看引用</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="h-8 w-8 rounded-md text-muted-foreground/35 opacity-100 pointer-events-none"
                    aria-label="私密记录解锁后可使用更多操作"
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">私密记录解锁后可使用更多操作</TooltipContent>
            </Tooltip>
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
              !showViewOriginal &&
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
            )}
          >
            查看原文
          </Button>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleBacklinks}
                  className={cn(
                    "h-8 w-8 rounded-md transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100 [@media(pointer:coarse)]:active:scale-95 max-[350px]:hidden",
                    showBacklinks
                      ? "bg-primary/10 text-primary opacity-100"
                      : "text-muted-foreground",
                    (showBacklinks || isMenuOpen) && "opacity-100"
                  )}
                  aria-expanded={showBacklinks}
                  aria-label="查看引用"
                >
                  <HugeiconsIcon icon={Link02Icon} size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">查看引用</TooltipContent>
            </Tooltip>
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
              showBacklinks={showBacklinks}
              onToggleBacklinks={onToggleBacklinks}
            />
          </>
        )}
      </div>
    </div>
  )
}
