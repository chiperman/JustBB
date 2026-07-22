"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { ContextPageShell } from "@/shared/layout/ContextPageShell"
import { MemoCardSkeleton } from "@/shared/ui/MemoCardSkeleton"

import { useTrashMemos } from "./hooks/useTrashMemos"
import { TrashHeader } from "./components/TrashHeader"
import { TrashEmptyState } from "./components/TrashEmptyState"
import { TrashItem } from "./components/TrashItem"
import { useDelayedLoadingVisibility } from "@/shared/hooks/useDelayedLoadingVisibility"

export function TrashClient() {
  const { memos, isLoading, isPending, handleEmptyTrash } = useTrashMemos()
  const showInitialSkeleton = useDelayedLoadingVisibility(isLoading)
  const shouldReduceMotion = useReducedMotion()
  const canShowResolvedContent = !isLoading && !showInitialSkeleton
  const transitionDuration = shouldReduceMotion ? 0 : 0.2
  const isEmpty = canShowResolvedContent && memos.length === 0

  return (
    <ContextPageShell
      scrollable={!isEmpty}
      maxWidthClassName={isEmpty ? "max-w-screen-xl h-full flex flex-col min-h-0" : undefined}
      contentClassName={isEmpty ? "flex-1 h-full min-h-0 pt-4 pb-6 flex flex-col" : undefined}
      header={
        <TrashHeader count={memos.length} isPending={isPending} onEmptyTrash={handleEmptyTrash} />
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {showInitialSkeleton ? (
          <motion.div
            key="trash-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
            className="space-y-6"
          >
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className="h-4 w-36 rounded bg-muted/20 animate-pulse motion-reduce:animate-none" />
                <MemoCardSkeleton />
              </div>
            ))}
          </motion.div>
        ) : isLoading ? (
          <div key="trash-pending" className="min-h-[400px]" aria-hidden="true" />
        ) : memos.length === 0 ? (
          <motion.div
            key="trash-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
            className="flex flex-1"
          >
            <TrashEmptyState />
          </motion.div>
        ) : (
          <motion.div
            key="trash-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
            className="space-y-6"
          >
            <AnimatePresence mode="popLayout">
              {memos.map((memo, idx) => (
                <TrashItem key={memo.id} memo={memo} index={idx} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </ContextPageShell>
  )
}
