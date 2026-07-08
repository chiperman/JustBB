"use client"

import { memo } from "react"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { useReducedMotion } from "framer-motion"
import { Memo } from "@/types/memo"
import { MemoEditor } from "./MemoEditor"
import { MemoCardView } from "./memo-card/MemoCardView"

interface MemoCardProps {
  memo: Memo
  isEditing?: boolean
  onEditChange?: (memoId: string, editing: boolean, updatedMemo?: Memo) => void
  showOriginalOnly?: boolean
  showViewOriginal?: boolean
}

export const MemoCard = memo(function MemoCard({
  memo,
  isEditing,
  onEditChange,
  showOriginalOnly = false,
  showViewOriginal = false,
  isLastCreated = false,
}: MemoCardProps & { isLastCreated?: boolean }) {
  const shouldReduceMotion = useReducedMotion()
  const hasMounted = useHasMounted()

  if (isEditing) {
    return (
      <article className="bg-card border border-border rounded-card p-6 relative z-20">
        <MemoEditor
          mode="edit"
          memo={memo}
          onCancel={() => onEditChange?.(memo.id, false)}
          onSuccess={(updatedMemo) => onEditChange?.(memo.id, false, updatedMemo)}
        />
      </article>
    )
  }

  return (
    <MemoCardView
      memo={memo}
      showOriginalOnly={showOriginalOnly}
      showViewOriginal={showViewOriginal}
      onEdit={() => onEditChange?.(memo.id, true)}
      shouldReduceMotion={!!shouldReduceMotion}
      hasMounted={hasMounted}
      isLastCreated={isLastCreated}
    />
  )
})
