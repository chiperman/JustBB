"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react"
import type { Memo } from "@/types/memo"
import { useMemoSync, type MemoEventPayload } from "@/lib/memos/events"
import { useViewerQuery } from "@/shared/hooks/useViewerQuery"
import { getViewerFeedMemos } from "@/shared/lib/viewer-memo-queries"
import { useSelection } from "@/state/UIContext"
import {
  createMemoFeedWindow,
  MEMO_FEED_PAGE_SIZE,
  reduceMemoFeedWindow,
  type MemoFeedSearchParams,
} from "@/features/memos/lib/memo-feed-reconciler"

interface UseMemoFeedProps {
  initialMemos: Memo[]
  searchParams: MemoFeedSearchParams
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

function getOldestMemoCursor(memos: Memo[]) {
  const unpinnedMemos = memos.filter((memo) => !memo.is_pinned)
  const oldestMemo = unpinnedMemos[unpinnedMemos.length - 1] ?? memos[memos.length - 1]
  return oldestMemo?.created_at
}

export function useMemoFeed({ initialMemos, searchParams, scrollContainerRef }: UseMemoFeedProps) {
  const { query } = useViewerQuery()
  const { registerMemos } = useSelection()
  const stableSearchParams = useMemo<MemoFeedSearchParams>(
    () => ({
      query: searchParams.query,
      tag: searchParams.tag,
      year: searchParams.year,
      month: searchParams.month,
      date: searchParams.date,
      sort: searchParams.sort,
      tagMode: searchParams.tagMode,
    }),
    [
      searchParams.date,
      searchParams.month,
      searchParams.query,
      searchParams.sort,
      searchParams.tag,
      searchParams.tagMode,
      searchParams.year,
    ]
  )
  const [windowState, dispatchWindow] = useReducer(
    reduceMemoFeedWindow,
    createMemoFeedWindow(initialMemos, stableSearchParams)
  )
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const isLoadingOlderRef = useRef(false)
  const olderCursorRef = useRef<string | undefined>(getOldestMemoCursor(initialMemos))
  const previousSearchParamsRef = useRef(stableSearchParams)

  // 置顶/取消置顶时的滚动位置恢复属于 DOM 接线，不进入纯 reconciler。
  const pendingScrollRestoreRef = useRef<number | null>(null)
  const pinReorderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pinReorderTimeoutRef.current) clearTimeout(pinReorderTimeoutRef.current)
    }
  }, [])

  useLayoutEffect(() => {
    if (pendingScrollRestoreRef.current == null) return
    const container = scrollContainerRef?.current
    if (container) container.scrollTop = pendingScrollRestoreRef.current
    // revalidatePath 可能再触发一轮首屏对齐；800ms 后统一释放滚动锁。
  }, [scrollContainerRef, windowState.memos])

  useEffect(() => {
    registerMemos(windowState.memos)
  }, [registerMemos, windowState.memos])

  useEffect(() => {
    if (previousSearchParamsRef.current !== stableSearchParams) {
      olderCursorRef.current = getOldestMemoCursor(initialMemos)
      previousSearchParamsRef.current = stableSearchParams
    }
    dispatchWindow({
      type: "receive-initial",
      memos: initialMemos,
      searchParams: stableSearchParams,
    })
  }, [initialMemos, stableSearchParams])

  const fetchOlderMemos = useCallback(async () => {
    if (isLoadingOlderRef.current || isLoadingOlder || !windowState.hasMoreOlder) return

    isLoadingOlderRef.current = true
    setIsLoadingOlder(true)
    try {
      const result = await query(getViewerFeedMemos, {
        ...stableSearchParams,
        limit: MEMO_FEED_PAGE_SIZE,
        before_date: olderCursorRef.current ?? getOldestMemoCursor(windowState.memos),
        excludePinned: true,
        sort: "newest",
      })

      if (!result.success) {
        throw new Error(result.error || "加载更早记录失败")
      }

      const olderPage = result.data || []
      const nextCursor = getOldestMemoCursor(olderPage)
      if (nextCursor) olderCursorRef.current = nextCursor

      dispatchWindow({ type: "append-older-page", memos: olderPage })
    } catch (error) {
      console.error("[Feed Hook] Failed to load older memos:", error)
      dispatchWindow({ type: "older-page-failed" })
    } finally {
      isLoadingOlderRef.current = false
      setIsLoadingOlder(false)
    }
  }, [isLoadingOlder, query, stableSearchParams, windowState.hasMoreOlder, windowState.memos])

  const updateMemoInList = useCallback((memo: Memo) => {
    dispatchWindow({ type: "replace-memo", memo })
  }, [])

  const clearLastCreatedId = useCallback(() => {
    dispatchWindow({ type: "clear-last-created" })
  }, [])

  useMemoSync(
    useCallback(
      (event: MemoEventPayload) => {
        if (event.type === "update" && "is_pinned" in event.updates) {
          if (typeof window !== "undefined" && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          const container = scrollContainerRef?.current
          if (container) pendingScrollRestoreRef.current = container.scrollTop

          if (pinReorderTimeoutRef.current) clearTimeout(pinReorderTimeoutRef.current)
          pinReorderTimeoutRef.current = setTimeout(() => {
            pendingScrollRestoreRef.current = null
            dispatchWindow({ type: "finish-pin-reorder" })
          }, 800)
        }

        dispatchWindow({ type: "memo-event", event })
      },
      [scrollContainerRef]
    )
  )

  return {
    memos: windowState.memos,
    isLoadingOlder,
    hasMoreOlder: windowState.hasMoreOlder,
    editingId,
    setEditingId,
    fetchOlderMemos,
    updateMemoInList,
    lastCreatedId: windowState.lastCreatedId,
    clearLastCreatedId,
    isPinReordering: windowState.isPinReordering,
  }
}
