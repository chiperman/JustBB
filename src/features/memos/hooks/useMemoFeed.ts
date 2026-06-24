"use client"

import { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react"
import { Memo } from "@/types/memo"
import { getMemos } from "@/server/actions/memos/query"
import { mergeMemos } from "@/shared/lib/streamUtils"
import { useMemoSync, MemoEventPayload } from "@/lib/memos/events"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { useSelection } from "@/state/UIContext"

interface UseMemoFeedProps {
  initialMemos: Memo[]
  searchParams: {
    query?: string
    tag?: string
    year?: string
    month?: string
    date?: string
    sort?: string
    tagMode?: "and" | "or"
  }
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

const INITIAL_MEMO_PAGE_SIZE = 30

export function reconcileInitialMemoWindow(
  currentMemos: Memo[],
  previousInitialIds: Set<string>,
  nextInitialMemos: Memo[]
) {
  const alignedNextInitialMemos = nextInitialMemos.map((nextMemo) => {
    const existing = currentMemos.find((m) => m.id === nextMemo.id)
    if (existing && !existing.is_locked && nextMemo.is_locked) {
      return existing
    }
    return nextMemo
  })

  const olderMemos = currentMemos.filter((memo) => !previousInitialIds.has(memo.id))
  return mergeMemos(olderMemos, alignedNextInitialMemos)
}

export function reconcileHasMoreOlder(currentHasMoreOlder: boolean, nextInitialMemos: Memo[]) {
  return currentHasMoreOlder && nextInitialMemos.length >= INITIAL_MEMO_PAGE_SIZE
}

export function reconcileUpdatedMemo(existingMemo: Memo, updatedMemo: Memo): Memo {
  return {
    ...existingMemo,
    ...updatedMemo,
    is_owner: updatedMemo.is_owner ?? existingMemo.is_owner,
    is_locked: updatedMemo.is_locked ?? existingMemo.is_locked,
  }
}

export function useMemoFeed({ initialMemos, searchParams, scrollContainerRef }: UseMemoFeedProps) {
  const { unlockedMemoIds } = useUnlockedMemos()
  const { registerMemos } = useSelection()
  const [memos, setMemos] = useState<Memo[]>(initialMemos)
  const [hasMoreOlder, setHasMoreOlder] = useState(initialMemos.length >= INITIAL_MEMO_PAGE_SIZE)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)
  const previousInitialIdsRef = useRef(new Set(initialMemos.map((memo) => memo.id)))
  const lastSearchParamsRef = useRef(searchParams)

  // 置顶/取消置顶时的滚动位置恢复
  const pendingScrollRestoreRef = useRef<number | null>(null)
  // 标记当前是否处于 pin 重排中，供外部跳过动画
  const [isPinReordering, setIsPinReordering] = useState(false)
  const pinReorderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (pinReorderTimeoutRef.current) {
        clearTimeout(pinReorderTimeoutRef.current)
      }
    }
  }, [])

  // 在 DOM 更新后、浏览器绘制前恢复滚动位置
  useLayoutEffect(() => {
    if (pendingScrollRestoreRef.current != null) {
      const container = scrollContainerRef?.current
      if (container) {
        container.scrollTop = pendingScrollRestoreRef.current
      }
      // 注意：不要在此处清空 pendingScrollRestoreRef.current，
      // 因为接下来的 revalidatePath 引起的 initialMemos 变更还会触发一轮 layoutEffect。
      // 我们在 800ms 后才由定时器完全重置和解锁。
    }
  }, [memos, scrollContainerRef])

  useEffect(() => {
    registerMemos(memos)
  }, [memos, registerMemos])

  useEffect(() => {
    const paramsChanged =
      searchParams.query !== lastSearchParamsRef.current.query ||
      searchParams.tag !== lastSearchParamsRef.current.tag ||
      searchParams.year !== lastSearchParamsRef.current.year ||
      searchParams.month !== lastSearchParamsRef.current.month ||
      searchParams.date !== lastSearchParamsRef.current.date ||
      searchParams.tagMode !== lastSearchParamsRef.current.tagMode ||
      searchParams.sort !== lastSearchParamsRef.current.sort

    if (paramsChanged) {
      setMemos(initialMemos)
      setHasMoreOlder(initialMemos.length >= INITIAL_MEMO_PAGE_SIZE)
      previousInitialIdsRef.current = new Set(initialMemos.map((memo) => memo.id))
      lastSearchParamsRef.current = searchParams
    } else {
      const prevInitialIds = previousInitialIdsRef.current
      setMemos((prev) => reconcileInitialMemoWindow(prev, prevInitialIds, initialMemos))
      setHasMoreOlder((prev) => reconcileHasMoreOlder(prev, initialMemos))
      previousInitialIdsRef.current = new Set(initialMemos.map((memo) => memo.id))
    }
  }, [initialMemos, searchParams])

  const fetchOlderMemos = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlder) return

    setIsLoadingOlder(true)
    try {
      const limit = INITIAL_MEMO_PAGE_SIZE
      const unpinnedMemos = memos.filter((m) => !m.is_pinned)
      const lastMemo =
        unpinnedMemos.length > 0 ? unpinnedMemos[unpinnedMemos.length - 1] : memos[memos.length - 1]

      const res = await getMemos({
        ...searchParams,
        limit,
        before_date: lastMemo?.created_at,
        excludePinned: true,
        sort: "newest",
        unlockedMemoIds,
      })

      const nextMemos = res.data || []
      const validNewMemos = nextMemos.filter((nm) => !memos.find((m) => m.id === nm.id))

      if (nextMemos.length < limit || validNewMemos.length === 0) {
        setHasMoreOlder(false)
      }

      if (validNewMemos.length > 0) {
        setMemos((prev) => mergeMemos(prev, validNewMemos))
      }
    } catch (err) {
      console.error("[Feed Hook] Failed to load older memos:", err)
      setHasMoreOlder(false)
    } finally {
      setIsLoadingOlder(false)
    }
  }, [isLoadingOlder, hasMoreOlder, memos, searchParams, unlockedMemoIds])

  const updateMemoInList = useCallback((updatedMemo: Memo) => {
    setMemos((prev) =>
      prev.map((m) => (m.id === updatedMemo.id ? reconcileUpdatedMemo(m, updatedMemo) : m))
    )
  }, [])

  const clearLastCreatedId = useCallback(() => {
    setLastCreatedId(null)
  }, [])

  useMemoSync(
    useCallback((payload: MemoEventPayload) => {
      // 置顶/取消置顶时，在 state 更新前记录滚动位置，并在 800ms 内强制锁定
      if (payload.type === "update" && payload.updates && "is_pinned" in payload.updates) {
        if (typeof window !== "undefined" && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        const container = scrollContainerRef?.current
        if (container) {
          pendingScrollRestoreRef.current = container.scrollTop
        }

        setIsPinReordering(true)
        if (pinReorderTimeoutRef.current) {
          clearTimeout(pinReorderTimeoutRef.current)
        }
        pinReorderTimeoutRef.current = setTimeout(() => {
          pendingScrollRestoreRef.current = null
          setIsPinReordering(false)
        }, 800)

        setMemos((prev) => {
          const updated = prev.map((m) => (m.id === payload.id ? { ...m, ...payload.updates } : m))
          return mergeMemos([], updated)
        })
        return
      }

      setMemos((prev) => {
        switch (payload.type) {
          case "create":
            if (prev.some((m) => m.id === payload.memo.id)) return prev
            setLastCreatedId(payload.memo.id)
            return mergeMemos(prev, [payload.memo])
          case "update": {
            const updated = prev.map((m) =>
              m.id === payload.id ? { ...m, ...payload.updates } : m
            )
            return updated
          }
          case "delete":
            return prev.filter((m) => m.id !== payload.id)
          default:
            return prev
        }
      })
    }, [])
  )

  return {
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
  }
}
