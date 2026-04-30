import { useEffect } from "react"
import { Memo } from "@/types/memo"

export type MemoEventPayload =
  | { type: "create"; memo: Memo }
  | { type: "update"; id: string; updates: Partial<Memo> }
  | { type: "delete"; id: string }

export function shouldRefreshMemoDerivedData(payload: MemoEventPayload) {
  if (payload.type !== "update") {
    return true
  }

  return (
    payload.updates.content !== undefined ||
    payload.updates.tags !== undefined ||
    payload.updates.word_count !== undefined ||
    payload.updates.created_at !== undefined ||
    payload.updates.deleted_at !== undefined ||
    payload.updates.is_private !== undefined
  )
}

const MEMO_EVENT_NAME = "justbb-memo-sync"

/**
 * 触发全局 Memo 状态同步事件
 */
export const dispatchMemoEvent = (payload: MemoEventPayload) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MEMO_EVENT_NAME, { detail: payload }))
  }
}

/**
 * 监听全局 Memo 状态同步事件（Hook）
 */
export const useMemoSync = (callback: (payload: MemoEventPayload) => void) => {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<MemoEventPayload>).detail
      if (detail) {
        callback(detail)
      }
    }

    window.addEventListener(MEMO_EVENT_NAME, handler)
    return () => window.removeEventListener(MEMO_EVENT_NAME, handler)
  }, [callback])
}
