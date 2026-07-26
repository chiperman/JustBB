import type { FetchMemosInput } from "@/lib/memos/schemas"
import {
  getGalleryMemos,
  getMemos,
  getMemosWithLocations,
  getBacklinks,
  getOnThisDayMemos,
  searchMemosForMention,
} from "@/server/actions/memos/query"

/**
 * 各 Memo 查询域的薄 adapter：统一把查看者底座注入的解锁集合放到正确位置。
 * 消费方只传业务参数，不接触 unlockedMemoIds。
 */

type ViewerFeedParams = Omit<Partial<FetchMemosInput>, "unlockedMemoIds">

export function getViewerFeedMemos(params: ViewerFeedParams, unlockedMemoIds: string[]) {
  return getMemos({ ...params, unlockedMemoIds })
}

export function getViewerGalleryMemos(limit: number, offset: number, unlockedMemoIds: string[]) {
  return getGalleryMemos(limit, offset, unlockedMemoIds)
}

export function getViewerMapMemos(unlockedMemoIds: string[]) {
  return getMemosWithLocations(unlockedMemoIds)
}

export function getViewerMentionMemos(
  searchText: string,
  offset: number,
  limit: number,
  unlockedMemoIds: string[]
) {
  return searchMemosForMention(searchText, offset, limit, unlockedMemoIds)
}

export function getViewerBacklinks(memoNumber: number, unlockedMemoIds: string[]) {
  return getBacklinks(memoNumber, unlockedMemoIds)
}

export function getViewerOnThisDayMemos(unlockedMemoIds: string[]) {
  return getOnThisDayMemos(unlockedMemoIds)
}
