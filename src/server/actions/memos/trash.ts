"use server"

import { revalidatePath } from "next/cache"
import { getClient } from "@/lib/supabase"
import { deleteImagesFromR2 } from "@/server/services/r2"
import { ActionResponse } from "../shared/types"
import { getCurrentUserId } from "@/features/auth/actions"
import { Memo } from "@/types/memo"
import { getMemosQuery, MemoFilters } from "@/lib/memos/query-builder"

/**
 * 软删除笔记
 */
export async function deleteMemo(id: string): Promise<ActionResponse> {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const supabase = await getClient()
  const { error } = await supabase
    .from("memos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", viewerId)

  if (error) {
    console.error("Error soft deleting memo:", error)
    return { success: false, error: "删除失败" }
  }

  revalidatePath("/")
  revalidatePath("/trash")
  return { success: true, error: null }
}

/**
 * 恢复笔记
 */
export async function restoreMemo(id: string): Promise<ActionResponse> {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const supabase = await getClient()
  const { error } = await supabase
    .from("memos")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("owner_id", viewerId)

  if (error) {
    console.error("Error restoring memo:", error)
    return { success: false, error: "恢复失败" }
  }

  revalidatePath("/trash")
  revalidatePath("/")
  return { success: true, error: null }
}

/**
 * 硬删除笔记
 */
export async function permanentDeleteMemo(id: string): Promise<ActionResponse> {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const supabase = await getClient()

  // 1. 查询该笔记关联的图片
  const { data: memo } = await supabase
    .from("memos")
    .select("images")
    .eq("id", id)
    .eq("owner_id", viewerId)
    .single()

  if (memo?.images && memo.images.length > 0) {
    await deleteImagesFromR2(memo.images, viewerId)
  }

  // 2. 执行物理删除
  const { error } = await supabase.from("memos").delete().eq("id", id).eq("owner_id", viewerId)

  if (error) {
    console.error("Error permanently deleting memo:", error)
    return { success: false, error: "彻底删除失败" }
  }

  revalidatePath("/trash")
  return { success: true, error: null }
}

/**
 * 清空回收站
 */
export async function emptyTrash(): Promise<ActionResponse> {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const supabase = await getClient()

  // 1. 查询回收站中所有笔记的图片
  const { data: memos, error: fetchError } = await supabase
    .from("memos")
    .select("images")
    .eq("owner_id", viewerId)
    .not("deleted_at", "is", null)

  if (fetchError) {
    console.error("Error fetching trashed memos before emptying:", fetchError)
  } else if (memos) {
    const allImages = memos.flatMap((m) => m.images || [])
    if (allImages.length > 0) {
      await deleteImagesFromR2(allImages, viewerId)
    }
  }

  // 2. 执行物理删除
  const { error } = await MemoFilters.trashedOnly(
    supabase.from("memos").delete().eq("owner_id", viewerId)
  )

  if (error) {
    console.error("Error emptying trash:", error)
    return { success: false, error: "清空回收站失败" }
  }

  revalidatePath("/trash")
  return { success: true, error: null }
}

/**
 * 获取回收站内容
 */
export async function getTrashMemos(): Promise<ActionResponse<Memo[]>> {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录", data: [] }

  const { query: qBuilder } = await getMemosQuery()
  const q = MemoFilters.trashedOnly(qBuilder)
    .eq("owner_id", viewerId)
    .order("deleted_at", { ascending: false })

  const { data, error } = await q

  if (error) {
    console.error("Error fetching trash memos:", error)
    return { success: false, error: "获取回收站数据失败", data: [] }
  }

  const memos = ((data as unknown as Memo[]) || []).map((memo) => ({
    ...memo,
    is_locked: false,
    is_owner: true,
  })) as Memo[]

  return { success: true, error: null, data: memos }
}

/**
 * 批量操作：删除、恢复、永久删除
 */
export async function batchTrashAction(
  ids: string[],
  action: "delete" | "restore" | "permanent"
): Promise<ActionResponse> {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }
  if (ids.length === 0) return { success: true, error: null }

  const supabase = await getClient()
  let query

  if (action === "delete") {
    query = supabase
      .from("memos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("owner_id", viewerId)
      .in("id", ids)
  } else if (action === "restore") {
    query = supabase
      .from("memos")
      .update({ deleted_at: null })
      .eq("owner_id", viewerId)
      .in("id", ids)
  } else {
    // 1. 查询这些笔记关联的图片
    const { data: memos, error: fetchError } = await supabase
      .from("memos")
      .select("images")
      .eq("owner_id", viewerId)
      .in("id", ids)

    if (fetchError) {
      console.error("Error fetching memos before batch permanent delete:", fetchError)
    } else if (memos) {
      const allImages = memos.flatMap((m) => m.images || [])
      if (allImages.length > 0) {
        await deleteImagesFromR2(allImages, viewerId)
      }
    }

    // 2. 执行物理删除
    query = supabase.from("memos").delete().eq("owner_id", viewerId).in("id", ids)
  }

  const { error } = await query
  if (error) {
    console.error(`Error in batch ${action}:`, error)
    return { success: false, error: "批量操作失败" }
  }

  revalidatePath("/")
  revalidatePath("/trash")
  return { success: true, error: null }
}

/**
 * 批量删除笔记（软删除）
 */
export async function batchDeleteMemos(ids: string[]): Promise<ActionResponse> {
  return batchTrashAction(ids, "delete")
}

/**
 * 批量恢复笔记
 */
export async function batchRestoreMemos(ids: string[]): Promise<ActionResponse> {
  return batchTrashAction(ids, "restore")
}

/**
 * 批量永久删除笔记
 */
export async function batchPermanentDeleteMemos(ids: string[]): Promise<ActionResponse> {
  return batchTrashAction(ids, "permanent")
}
