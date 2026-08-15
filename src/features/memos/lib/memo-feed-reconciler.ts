import type { Memo } from "@/types/memo"
import type { MemoEventPayload } from "@/lib/memos/events"
import { mergeMemos } from "@/shared/lib/streamUtils"

export const MEMO_FEED_PAGE_SIZE = 30

export type MemoFeedSearchParams = {
  query?: string
  tag?: string
  year?: string
  month?: string
  date?: string
  sort?: string
  tagMode?: "and" | "or"
}

export type MemoFeedWindow = {
  memos: Memo[]
  hasMoreOlder: boolean
  previousInitialIds: Set<string>
  searchKey: string
  lastCreatedId: string | null
  isPinReordering: boolean
}

export type MemoFeedWindowAction =
  | { type: "receive-initial"; memos: Memo[]; searchParams: MemoFeedSearchParams }
  | { type: "append-older-page"; memos: Memo[] }
  | { type: "older-page-failed" }
  | { type: "memo-event"; event: MemoEventPayload }
  | { type: "replace-memo"; memo: Memo }
  | { type: "clear-last-created" }
  | { type: "finish-pin-reorder" }

function getSearchKey(params: MemoFeedSearchParams) {
  return JSON.stringify([
    params.query ?? "",
    params.tag ?? "",
    params.year ?? "",
    params.month ?? "",
    params.date ?? "",
    params.tagMode ?? "and",
    params.sort ?? "newest",
  ])
}

function alignInitialWindow(state: MemoFeedWindow, nextInitialMemos: Memo[]) {
  const aligned = nextInitialMemos.map((nextMemo) => {
    const existing = state.memos.find((memo) => memo.id === nextMemo.id)
    return existing && !existing.is_locked && nextMemo.is_locked ? existing : nextMemo
  })
  const older = state.memos.filter((memo) => !state.previousInitialIds.has(memo.id))
  return mergeMemos(older, aligned)
}

function replaceMemo(existing: Memo, updated: Memo): Memo {
  return {
    ...existing,
    ...updated,
    is_owner: updated.is_owner ?? existing.is_owner,
    is_locked: updated.is_locked ?? existing.is_locked,
  }
}

export function createMemoFeedWindow(
  initialMemos: Memo[],
  searchParams: MemoFeedSearchParams
): MemoFeedWindow {
  return {
    memos: initialMemos,
    hasMoreOlder: initialMemos.length >= MEMO_FEED_PAGE_SIZE,
    previousInitialIds: new Set(initialMemos.map((memo) => memo.id)),
    searchKey: getSearchKey(searchParams),
    lastCreatedId: null,
    isPinReordering: false,
  }
}

export function reduceMemoFeedWindow(
  state: MemoFeedWindow,
  action: MemoFeedWindowAction
): MemoFeedWindow {
  switch (action.type) {
    case "receive-initial": {
      const searchKey = getSearchKey(action.searchParams)
      const previousInitialIds = new Set(action.memos.map((memo) => memo.id))
      if (searchKey !== state.searchKey) {
        return {
          ...state,
          memos: action.memos,
          hasMoreOlder: action.memos.length >= MEMO_FEED_PAGE_SIZE,
          previousInitialIds,
          searchKey,
          lastCreatedId: null,
        }
      }
      return {
        ...state,
        memos: alignInitialWindow(state, action.memos),
        hasMoreOlder: state.hasMoreOlder && action.memos.length >= MEMO_FEED_PAGE_SIZE,
        previousInitialIds,
      }
    }
    case "append-older-page": {
      const existingIds = new Set(state.memos.map((memo) => memo.id))
      const unique = action.memos.filter((memo) => !existingIds.has(memo.id))
      return {
        ...state,
        memos: unique.length > 0 ? [...state.memos, ...unique] : state.memos,
        hasMoreOlder: state.hasMoreOlder && action.memos.length >= MEMO_FEED_PAGE_SIZE,
      }
    }
    case "older-page-failed":
      return { ...state, hasMoreOlder: false }
    case "replace-memo":
      return {
        ...state,
        memos: state.memos.map((memo) =>
          memo.id === action.memo.id ? replaceMemo(memo, action.memo) : memo
        ),
      }
    case "memo-event": {
      const event = action.event
      if (event.type === "create") {
        if (state.memos.some((memo) => memo.id === event.memo.id)) return state
        return {
          ...state,
          memos: mergeMemos(state.memos, [event.memo]),
          lastCreatedId: event.memo.id,
        }
      }
      if (event.type === "delete") {
        return { ...state, memos: state.memos.filter((memo) => memo.id !== event.id) }
      }
      if (event.type === "restore") return state

      const memos = state.memos.map((memo) =>
        memo.id === event.id ? { ...memo, ...event.updates } : memo
      )
      return {
        ...state,
        memos: "is_pinned" in event.updates ? mergeMemos([], memos) : memos,
        isPinReordering: "is_pinned" in event.updates ? true : state.isPinReordering,
      }
    }
    case "clear-last-created":
      return { ...state, lastCreatedId: null }
    case "finish-pin-reorder":
      return { ...state, isPinReordering: false }
  }
}
