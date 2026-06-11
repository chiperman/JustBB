"use server"

import { getClient, getAdminClient } from "@/lib/supabase"
import { Json, Database } from "@/types/database"
import { Memo, Location } from "@/types/memo"
import { ActionResponse } from "../shared/types"
import { fetchMemosSchema, FetchMemosInput } from "@/lib/memos/schemas"
import {
  BASE_MEMO_SELECT,
  getMemosQuery,
  MemoFilters,
} from "@/lib/memos/query-builder"
import { getCurrentUserId } from "@/features/auth/actions"
import { withViewerAccess } from "@/lib/memos/visibility"

/**
 * 核心安全查询方法 (RPC 驱动)
 * 现在支持更严格的类型校验
 */
export async function getMemos(
  params: Partial<FetchMemosInput> = {}
): Promise<ActionResponse<Memo[]>> {
  const validation = fetchMemosSchema.safeParse(params)
  if (!validation.success) {
    return { success: false, error: "查询参数无效", data: [] }
  }

  const {
    query,
    limit,
    offset,
    tag,
    num,
    date,
    year,
    month,
    sort,
    after_date,
    before_date,
    excludePinned,
    unlockedMemoIds,
  } = validation.data

  const supabase = await getClient()
  const filters: Record<string, unknown> = {}

  if (tag) filters.tag = tag
  if (num) filters.num = num
  if (year) filters.year = year
  if (month) filters.month = month
  if (date && !before_date && !after_date) filters.date = date
  if (after_date) filters.after_date = after_date
  if (before_date) filters.before_date = before_date
  if (excludePinned) filters.exclude_pinned = true

  const { data, error } = await supabase.rpc("search_memos_secure", {
    query_text: query,
    unlocked_ids: unlockedMemoIds,
    limit_val: limit,
    offset_val: offset,
    filters: filters as unknown as Json,
    sort_order: sort,
  })

  if (error) {
    console.error("Error fetching memos via RPC:", error)
    return { success: false, error: "查询失败", data: [] }
  }

  // 此时 data 已经是正确格式，由于 Memo 继承自数据库 Row，类型更安全
  return { success: true, error: null, data: (data as unknown as Memo[]) || [] }
}

/**
 * 为 Mention 搜索笔记 (带补丁逻辑)
 */
export async function searchMemosForMention(
  query: string,
  offset: number = 0,
  limit: number = 10,
  unlockedMemoIds: string[] = []
): Promise<ActionResponse<Memo[]>> {
  if (!query.trim()) {
    const feed = await getMemos({ limit, offset, unlockedMemoIds })
    return {
      success: feed.success,
      error: feed.error,
      data: (feed.data || []).filter((memo) => !memo.is_locked),
    }
  }

  const isNum = /^\d+$/.test(query)
  const results = await getMemos(
    isNum
      ? { query: "", limit, offset, num: query, unlockedMemoIds }
      : { query, limit, offset, unlockedMemoIds }
  )

  return {
    success: results.success,
    error: results.error,
    data: (results.data || []).filter((memo) => !memo.is_locked),
  }
}

/**
 * 获取笔记轻量索引
 */
export async function getMemoIndex(): Promise<ActionResponse<Partial<Memo>[]>> {
  const { query: qBuilder } = await getMemosQuery()
  const q = MemoFilters.active(qBuilder).order("created_at", {
    ascending: false,
  })

  const { data, error } = await q
  if (error) return { success: false, error: error.message, data: [] }
  return {
    success: true,
    error: null,
    data: (data || []) as unknown as Partial<Memo>[],
  }
}

/**
 * 获取画廊笔记 (带图片的)
 */
export async function getGalleryMemos(
  limit: number = 20,
  offset: number = 0,
  unlockedMemoIds: string[] = []
): Promise<ActionResponse<Memo[]>> {
  const viewerId = await getCurrentUserId()
  const supabase = await getClient()
  const { data, error } = await supabase.rpc("search_memos_secure", {
    query_text: "",
    unlocked_ids: unlockedMemoIds,
    limit_val: limit,
    offset_val: offset,
    filters: { has_image: "true" } as unknown as Json,
    sort_order: "newest",
  })

  if (error) {
    console.error("Error fetching gallery memos via RPC:", error)
    return { success: false, error: error.message, data: [] }
  }

  const memos = (
    (data ||
      []) as Database["public"]["Functions"]["search_memos_secure"]["Returns"]
  ).map((memo) => {
    const isOwner = Boolean(viewerId && memo.owner_id === viewerId)
    const canView =
      !memo.is_private || isOwner || unlockedMemoIds.includes(memo.id)
    const isLocked = memo.is_locked ?? !canView

    let content = memo.content || ""
    if (isLocked && !isOwner) {
      content = "![Locked](/images/locked-placeholder.png)"
    }

    return {
      ...memo,
      content,
      is_owner: isOwner,
      is_locked: isLocked,
    } as unknown as Memo
  })

  return { success: true, error: null, data: memos }
}

/**
 * 获取归档笔记 (按年月)
 */
export async function getArchivedMemos(
  year: number,
  month: number
): Promise<ActionResponse<Memo[]>> {
  const viewerId = await getCurrentUserId()
  const startDate = new Date(year, month - 1, 1, 0, 0, 0).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { query: qBuilder } = await getMemosQuery()
  let q = MemoFilters.active(qBuilder)
  q = MemoFilters.dateRange(q, startDate, endDate)
  q = q.order("created_at", { ascending: false })

  const { data, error } = await q
  if (error) {
    console.error("Error fetching archived memos:", error)
    return { success: false, error: error.message, data: [] }
  }

  return {
    success: true,
    error: null,
    data: ((data || []) as Memo[]).map((memo) => ({
      ...memo,
      is_owner: memo.owner_id === viewerId,
      is_locked: memo.is_private && memo.owner_id !== viewerId,
    })),
  }
}

/**
 * 根据编号获取笔记 (用于预览/引用)
 * 使用 search_memos_secure RPC，RPC 内部已通过 SECURITY DEFINER + auth.uid() 实现 RLS
 */
export async function getMemoByNumber(
  memoNumber: number,
  unlockedMemoIds: string[] = []
): Promise<ActionResponse<Memo | null>> {
  const supabase = await getClient()
  const { data, error } = await supabase.rpc("search_memos_secure", {
    query_text: "",
    unlocked_ids: unlockedMemoIds,
    limit_val: 1,
    offset_val: 0,
    filters: { num: String(memoNumber) } as unknown as Json,
    sort_order: "newest",
  })

  if (error) {
    console.error("Error fetching memo by number via RPC:", error)
    return { success: false, error: "查询失败", data: null }
  }

  if (!data || data.length === 0) {
    return { success: true, error: null, data: null }
  }

  const memo = data[0] as Memo
  return {
    success: true,
    error: null,
    data: memo.is_locked ? null : memo,
  }
}

export async function getMemoById(
  memoId: string,
  unlockedMemoIds: string[] = []
): Promise<ActionResponse<Memo | null>> {
  if (!memoId) {
    return { success: false, error: "缺少 Memo ID", data: null }
  }

  const viewerId = await getCurrentUserId()
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from("memos")
    .select(BASE_MEMO_SELECT)
    .eq("id", memoId)
    .is("deleted_at", null)
    .single()

  if (error) {
    if (error.code === "PGRST116")
      return { success: true, error: null, data: null }
    return { success: false, error: error.message, data: null }
  }

  const memo = data as Memo
  const viewerMemo = withViewerAccess(memo, viewerId, unlockedMemoIds, {
    allowLockedPlaceholder: true,
  })

  return {
    success: true,
    error: null,
    data: viewerMemo,
  }
}

/**
 * 获取反向引用 (Backlinks)
 */
export async function getBacklinks(
  memoNumber: number
): Promise<ActionResponse<Memo[]>> {
  if (!memoNumber) return { success: true, error: null, data: [] }

  const { query: qBuilder } = await getMemosQuery()
  let q = MemoFilters.active(qBuilder)
  q = q
    .ilike("content", `%@${memoNumber}%`)
    .order("created_at", { ascending: false })

  const { data, error } = await q
  if (error || !data)
    return { success: false, error: error?.message || "未知错误", data: [] }

  const filteredMemos = (data as unknown as Memo[]).filter((m) => {
    const regex = new RegExp(`@${memoNumber}(?!\\d)`)
    return regex.test(m.content || "")
  })

  return { success: true, error: null, data: filteredMemos }
}

/**
 * 获取所有包含定位信息的笔记 (用于地图)
 */
export async function getMemosWithLocations(
  unlockedMemoIds: string[] = []
): Promise<ActionResponse<(Memo & { locations: Location[] })[]>> {
  const viewerId = await getCurrentUserId()
  const supabase = await getClient()
  const { data, error } = await supabase.rpc("search_memos_secure", {
    query_text: "",
    unlocked_ids: unlockedMemoIds,
    limit_val: 1000,
    offset_val: 0,
    filters: { has_location: "true" } as unknown as Json,
    sort_order: "newest",
  })

  if (error) {
    console.error("Error fetching memos with locations via RPC:", error)
    return { success: false, error: "获取定位数据失败", data: [] }
  }

  const memosWithLocations = (
    (data ||
      []) as Database["public"]["Functions"]["search_memos_secure"]["Returns"]
  )
    .map((memo) =>
      withViewerAccess(memo as unknown as Memo, viewerId, unlockedMemoIds, {
        allowLockedPlaceholder: true,
      })
    )
    .filter((memo): memo is Memo => memo !== null)
    .filter(
      (memo) => Array.isArray(memo.locations) && memo.locations.length > 0
    )
    .map((memo) => ({
      ...memo,
      locations: memo.locations as unknown as Location[],
    })) as (Memo & { locations: Location[] })[]

  return { success: true, error: null, data: memosWithLocations }
}

/**
 * "那年今日" 回溯年数
 */
const ON_THIS_DAY_LOOKBACK_YEARS = 5

/**
 * 获取“那年今日”笔记
 */
export async function getOnThisDayMemos(): Promise<ActionResponse<Memo[]>> {
  const viewerId = await getCurrentUserId()
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const currentYear = today.getFullYear()

  const startDate = new Date(
    currentYear - ON_THIS_DAY_LOOKBACK_YEARS,
    month - 1,
    day,
    0,
    0,
    0
  ).toISOString()
  const endDate = new Date(
    currentYear - 1,
    month - 1,
    day,
    23,
    59,
    59
  ).toISOString()

  const { query: qBuilder } = await getMemosQuery()
  let q = MemoFilters.active(qBuilder)
  q = MemoFilters.dateRange(q, startDate, endDate)
  q = q.order("created_at", { ascending: false })

  const { data, error } = await q
  if (error || !data)
    return { success: false, error: error?.message || "查询失败", data: [] }

  const filteredMemos = (data as unknown as Memo[]).filter((memo) => {
    const d = new Date(memo.created_at)
    return d.getMonth() + 1 === month && d.getDate() === day
  })

  return {
    success: true,
    error: null,
    data: filteredMemos.map((memo) => ({
      ...memo,
      is_owner: memo.owner_id === viewerId,
      is_locked: memo.is_private && memo.owner_id !== viewerId,
    })),
  }
}
