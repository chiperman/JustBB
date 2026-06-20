"use client"

import { useState } from "react"
import { cn } from "@/shared/lib/utils"
import { useSelection } from "@/state/UIContext"
import { Memo } from "@/types/memo"
import { MemoContent } from "../MemoContent"
import { UnlockDialog } from "../UnlockDialog"
import { MemoCardHeader } from "./MemoCardHeader"
import { MemoCardBacklinks } from "./MemoCardBacklinks"
import { MemoCardLockOverlay } from "./MemoCardLockOverlay"
import { useMemoBacklinks } from "../../hooks/useMemoBacklinks"
import { ExpandableContent } from "@/shared/ui/expandable-content"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { MemoImageGrid } from "./MemoImageGrid"

interface MemoCardViewProps {
  memo: Memo
  showOriginalOnly: boolean
  onEdit: () => void
  shouldReduceMotion: boolean
  hasMounted: boolean
  isLastCreated?: boolean
  showViewOriginal?: boolean
}

export function MemoCardView({
  memo,
  showOriginalOnly,
  onEdit,
  shouldReduceMotion,
  hasMounted,
  isLastCreated,
  showViewOriginal,
}: MemoCardViewProps) {
  const [isUnlockOpen, setIsUnlockOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isSelectionMode, selectedIds, toggleId } = useSelection()
  const { getUnlockedMemo } = useUnlockedMemos()
  const displayMemo = getUnlockedMemo(memo.id) || memo
  const isSelected = selectedIds.has(memo.id)

  const {
    backlinks,
    isLoading: loadingBacklinks,
    showBacklinks,
    toggleBacklinks,
  } = useMemoBacklinks(displayMemo.memo_number)

  const handleCardClick = () => {
    if (isSelectionMode) {
      toggleId(memo.id)
    }
  }

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        "relative bg-card rounded-lg p-6 transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-border hover:focus-within:ring-2 focus-within:ring-primary/10 group",
        displayMemo.is_pinned && "bg-(--badge-clay-bg)/50 border-primary/20",
        isSelectionMode && "cursor-pointer hover:border-primary/40 select-none",
        isSelectionMode && isSelected && "border-primary/35 bg-primary/[0.03]",
        isLastCreated && "animate-new-memo-highlight"
      )}
    >
      <MemoCardHeader
        memo={displayMemo}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onToggleSelection={() => toggleId(memo.id)}
        showOriginalOnly={showOriginalOnly}
        showViewOriginal={showViewOriginal}
        showBacklinks={showBacklinks}
        onToggleBacklinks={toggleBacklinks}
        onEdit={onEdit}
        onMenuOpenChange={setIsMenuOpen}
        isMenuOpen={isMenuOpen}
        hasMounted={hasMounted}
      />

      <div
        className={cn(
          "w-full transition-all mt-2",
          displayMemo.is_locked && "blur-sm select-none",
          isSelectionMode && "pointer-events-none"
        )}
      >
        {displayMemo.is_locked ? (
          <div className="text-base leading-relaxed text-muted-foreground italic opacity-60">
            这一条私密记录已被锁定，输入口令后即可解锁阅读。
          </div>
        ) : (
          <ExpandableContent
            needsExpansion={
              !showOriginalOnly &&
              (displayMemo.content.length > 300 || displayMemo.content.split("\n").length > 8)
            }
            collapsedHeight={200}
          >
            <MemoContent content={displayMemo.content} disablePreview={showOriginalOnly} />
            {!showOriginalOnly && displayMemo.images && displayMemo.images.length > 0 && (
              <MemoImageGrid images={displayMemo.images} />
            )}
          </ExpandableContent>
        )}
      </div>

      {!showOriginalOnly && (
        <div className={cn(isSelectionMode && "pointer-events-none")}>
          <MemoCardBacklinks
            memoId={displayMemo.id}
            showBacklinks={showBacklinks}
            isLoading={loadingBacklinks}
            backlinks={backlinks}
          />
        </div>
      )}

      {displayMemo.is_locked && (
        <div className={cn(isSelectionMode && "pointer-events-none")}>
          <MemoCardLockOverlay
            onUnlock={() => setIsUnlockOpen(true)}
            shouldReduceMotion={shouldReduceMotion}
          />
        </div>
      )}

      <UnlockDialog
        memoId={displayMemo.id}
        isOpen={isUnlockOpen}
        onClose={() => setIsUnlockOpen(false)}
        hint={displayMemo.access_code_hint}
      />
    </article>
  )
}
