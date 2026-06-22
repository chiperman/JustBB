"use client"

import { AnimatePresence } from "framer-motion"

import { ContextPageShell } from "@/shared/layout/ContextPageShell"
import { MemoCardSkeleton } from "@/shared/ui/MemoCardSkeleton"

import { useTrashMemos } from "./hooks/useTrashMemos"
import { TrashHeader } from "./components/TrashHeader"
import { TrashEmptyState } from "./components/TrashEmptyState"
import { TrashItem } from "./components/TrashItem"

export function TrashClient() {
  const { memos, isLoading, isPending, handleEmptyTrash } = useTrashMemos()
  const isEmpty = !isLoading && memos.length === 0

  return (
    <ContextPageShell
      scrollable={!isEmpty}
      maxWidthClassName={isEmpty ? "max-w-screen-xl h-full flex flex-col min-h-0" : undefined}
      contentClassName={isEmpty ? "flex-1 h-full min-h-0 pt-4 pb-6 flex flex-col" : undefined}
      header={
        <TrashHeader count={memos.length} isPending={isPending} onEmptyTrash={handleEmptyTrash} />
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-4 w-36 rounded bg-muted/20 animate-pulse" />
              <MemoCardSkeleton />
            </div>
          ))}
        </div>
      ) : memos.length === 0 ? (
        <TrashEmptyState />
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {memos.map((memo, idx) => (
              <TrashItem key={memo.id} memo={memo} index={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </ContextPageShell>
  )
}
