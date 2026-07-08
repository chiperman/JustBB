"use client"

import { useCallback, useEffect, useRef } from "react"
import { motion, Variants, AnimatePresence } from "framer-motion"
import { MemoCard } from "./MemoCard"
import { Memo } from "@/types/memo"

// Custom Hooks
import { useMemoFeed } from "../hooks/useMemoFeed"
import { useFeedScrollSpy } from "../hooks/useFeedScrollSpy"

// Sub-components
import { FeedItemWrapper } from "./memo-feed/FeedItemWrapper"
import { FeedStatus } from "./memo-feed/FeedStatus"
import { NewMemosIndicator } from "./memo-feed/NewMemosIndicator"

interface MemoFeedProps {
  initialMemos: Memo[]
  searchParams: {
    query?: string
    tag?: string
    year?: string
    month?: string
    date?: string
    sort?: string
  }
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: custom * 0.02 },
  }),
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const instantVariants: Variants = {
  initial: { opacity: 1, y: 0 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0 },
  },
  exit: { opacity: 1, transition: { duration: 0 } },
}

const ANIMATED_INITIAL_MEMO_COUNT = 30
const OLDER_MEMO_PREFETCH_DISTANCE_PX = 2400

export function MemoFeed({ initialMemos = [], searchParams, scrollContainerRef }: MemoFeedProps) {
  const observerTargetBottom = useRef<HTMLDivElement>(null)

  const {
    memos,
    isLoadingOlder,
    hasMoreOlder,
    editingId,
    setEditingId,
    fetchOlderMemos,
    updateMemoInList,
    lastCreatedId,
    clearLastCreatedId,
    isPinReordering,
  } = useMemoFeed({ initialMemos, searchParams, scrollContainerRef })

  const handleMemoEditChange = useCallback(
    (memoId: string, editing: boolean, updatedMemo?: Memo) => {
      if (!editing && updatedMemo) updateMemoInList(updatedMemo)
      setEditingId(editing ? memoId : null)
    },
    [setEditingId, updateMemoInList]
  )

  // 1. 无限滚动监听
  useEffect(() => {
    const bottom = observerTargetBottom.current
    if (!bottom) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingOlder && hasMoreOlder) {
          fetchOlderMemos()
        }
      },
      {
        root: scrollContainerRef?.current || null,
        rootMargin: `0px 0px ${OLDER_MEMO_PREFETCH_DISTANCE_PX}px 0px`,
        threshold: 0,
      }
    )

    observer.observe(bottom)
    return () => observer.disconnect()
  }, [fetchOlderMemos, isLoadingOlder, hasMoreOlder, scrollContainerRef])

  // 2. Scroll Spy 同步
  useFeedScrollSpy(memos.length)
  const isEmpty = !isLoadingOlder && memos.length === 0

  return (
    <div className={isEmpty ? "relative flex min-h-full flex-1 flex-col" : "relative space-y-6"}>
      <NewMemosIndicator lastCreatedId={lastCreatedId} clearLastCreatedId={clearLastCreatedId} />

      <motion.div initial={false} className={isEmpty ? "hidden" : "columns-1 gap-6 space-y-6"}>
        <AnimatePresence mode="popLayout">
          {memos.map((memo, index) => (
            <FeedItemWrapper
              key={memo.id}
              memo={memo}
              index={index}
              prevMemo={index > 0 ? memos[index - 1] : undefined}
              variants={
                isPinReordering || index >= ANIMATED_INITIAL_MEMO_COUNT
                  ? instantVariants
                  : itemVariants
              }
            >
              <div>
                <MemoCard
                  memo={memo}
                  isEditing={editingId === memo.id}
                  isLastCreated={lastCreatedId === memo.id}
                  onEditChange={handleMemoEditChange}
                />
              </div>
            </FeedItemWrapper>
          ))}
        </AnimatePresence>
      </motion.div>

      <div ref={observerTargetBottom} className={isEmpty ? "flex flex-1 flex-col" : undefined}>
        <FeedStatus
          isLoadingOlder={isLoadingOlder}
          hasMoreOlder={hasMoreOlder}
          memosCount={memos.length}
        />
      </div>
    </div>
  )
}
