"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { getClient, getAdminClient } from "@/lib/supabase"
import { ActionResponse } from "../shared/types"
import { Memo } from "@/types/memo"
import { getCurrentUserId, isAdmin } from "@/features/auth/actions"
import {
  calculateWordCount,
  extractImagesFromContent,
  extractLocations,
  mergeTagsIntoContent,
  removeTagsFromContent,
  renameTagInContent,
} from "@/lib/memos/parser"
import { buildMemoPayload } from "./helpers"
import { Database, Json } from "@/types/database"
import {
  createMemoSchema,
  updateMemoContentSchema,
  updateMemoStateSchema,
  batchAddTagsSchema,
} from "@/lib/memos/schemas"
import { withViewerAccess } from "@/lib/memos/visibility"

type MemoInsert = Database["public"]["Tables"]["memos"]["Insert"]
type ActionErrorLike = {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}
type ValidationIssueLike = {
  path: PropertyKey[]
  message: string
}

const TAG_RENAME_BATCH_SIZE = 50

function enrichViewerMemo(memo: Memo, viewerId: string): Memo {
  return (
    withViewerAccess(memo, viewerId) ?? {
      ...memo,
      is_owner: memo.owner_id === viewerId,
      is_locked: false,
    }
  )
}

function formatActionError(prefix: string, error?: ActionErrorLike | null) {
  if (!error) return prefix

  if (error.code === "PGRST116") {
    return `${prefix}：没有找到可操作的记录，可能这条 memo 不属于当前账号。`
  }

  return prefix
}

function logDatabaseError(
  action: string,
  context: Record<string, unknown>,
  error?: ActionErrorLike | null
) {
  console.error(action, {
    ...context,
    code: error?.code ?? null,
    message: error?.message ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
  })
}

function logValidationFailure(
  action: string,
  viewerId: string,
  issue: ValidationIssueLike,
  rawData: Record<string, FormDataEntryValue>
) {
  const context: Record<string, unknown> = {
    viewerId,
    issuePath: issue.path.map(String).join("."),
    issueMessage: issue.message,
    fields: Object.keys(rawData),
  }

  if (typeof rawData.id === "string") {
    context.memoId = rawData.id
  }

  console.error(action, context)
}

function normalizeImageMetadata(
  images: string[],
  metadata: Record<string, { width: number; height: number }>
): Json {
  return Object.fromEntries(
    images
      .map((url) => {
        const item = metadata[url]
        if (!item) return null

        return [
          url,
          {
            width: item.width,
            height: item.height,
          },
        ]
      })
      .filter((entry): entry is [string, { width: number; height: number }] => Boolean(entry))
  ) as Json
}

/**
 * 创建新笔记
 */
export async function createMemo(formData: FormData): Promise<ActionResponse<Memo>> {
  if (!(await isAdmin())) {
    return { success: false, error: "权限不足，仅管理员可进行此操作" }
  }
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const rawData = Object.fromEntries(formData.entries())
  const validation = createMemoSchema.safeParse(rawData)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  const { content, is_private, is_pinned, access_code, access_code_hint, images, image_metadata } =
    validation.data
  const normalizedMemo = extractImagesFromContent(content, images)
  const supabase = await getClient()

  const payload: Partial<MemoInsert> = {
    owner_id: viewerId,
    is_private,
    images: normalizedMemo.images,
    image_metadata: normalizeImageMetadata(normalizedMemo.images, image_metadata),
    ...buildMemoPayload(normalizedMemo.content, { isPinned: is_pinned }),
  }

  if (is_private && access_code) {
    const salt = await bcrypt.genSalt(10)
    payload.access_code_hash = await bcrypt.hash(access_code, salt)
    payload.access_code_hint = access_code_hint || null
  }

  const { data, error } = await supabase
    .from("memos")
    .insert(payload as MemoInsert)
    .select()
    .single()

  if (error) {
    logDatabaseError("Error creating memo", { viewerId }, error)
    return { success: false, error: formatActionError("发布失败", error) }
  }

  revalidatePath("/")
  revalidatePath("/gallery")
  return {
    success: true,
    error: null,
    data: enrichViewerMemo(data as Memo, viewerId),
  }
}

/**
 * 更新笔记内容 (含内容解析)
 */
export async function updateMemoContent(formData: FormData): Promise<ActionResponse<Memo>> {
  if (!(await isAdmin())) {
    return { success: false, error: "权限不足，仅管理员可进行此操作" }
  }
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const rawData = Object.fromEntries(formData.entries())
  const validation = updateMemoContentSchema.safeParse(rawData)

  if (!validation.success) {
    const issue = validation.error.issues[0]
    const receivedId = typeof rawData.id === "string" ? rawData.id : String(rawData.id ?? "")
    logValidationFailure("Invalid memo update payload", viewerId, issue, rawData)
    if (issue.path.includes("id")) {
      return { success: false, error: `无效的ID：${receivedId || "(空)"}` }
    }
    return { success: false, error: issue.message }
  }

  const { id, content, images, image_metadata } = validation.data
  const normalizedMemo = extractImagesFromContent(content, images)
  const supabase = await getClient()

  const { data, error } = await supabase
    .from("memos")
    .update({
      ...buildMemoPayload(normalizedMemo.content),
      images: normalizedMemo.images,
      image_metadata: normalizeImageMetadata(normalizedMemo.images, image_metadata),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", viewerId)
    .select()
    .single()

  if (error) {
    logDatabaseError("Error updating memo content", { viewerId, memoId: id }, error)
    return { success: false, error: formatActionError("保存失败", error) }
  }

  if (!data) {
    const noDataError = "保存失败：数据库没有返回更新后的记录，可能这条 memo 不属于当前账号。"
    console.error("Error updating memo content: no row returned", {
      viewerId,
      memoId: id,
    })
    return { success: false, error: noDataError }
  }

  revalidatePath("/")
  revalidatePath("/gallery")
  return {
    success: true,
    error: null,
    data: enrichViewerMemo(data as Memo, viewerId),
  }
}

/**
 * 更新笔记状态 (置顶、私密等)
 */
export async function updateMemoState(formData: FormData): Promise<ActionResponse<Memo>> {
  if (!(await isAdmin())) {
    return { success: false, error: "权限不足，仅管理员可进行此操作" }
  }
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const rawData = Object.fromEntries(formData.entries())
  const validation = updateMemoStateSchema.safeParse(rawData)

  if (!validation.success) {
    const issue = validation.error.issues[0]
    const receivedId = typeof rawData.id === "string" ? rawData.id : String(rawData.id ?? "")
    logValidationFailure("Invalid memo state payload", viewerId, issue, rawData)
    if (issue.path.includes("id")) {
      return { success: false, error: `无效的ID：${receivedId || "(空)"}` }
    }
    return { success: false, error: issue.message }
  }

  const { id, is_pinned, is_private, access_code, access_code_hint } = validation.data
  const supabase = await getClient()

  const updatePayload: Partial<MemoInsert> = {}
  if (is_pinned !== undefined) {
    updatePayload.is_pinned = is_pinned
    updatePayload.pinned_at = is_pinned ? new Date().toISOString() : null
  }

  if (is_private !== undefined) {
    updatePayload.is_private = is_private
    if (is_private && access_code) {
      const salt = await bcrypt.genSalt(10)
      updatePayload.access_code_hash = await bcrypt.hash(access_code, salt)
      updatePayload.access_code_hint = access_code_hint || null
    } else if (!is_private) {
      updatePayload.access_code_hash = null
      updatePayload.access_code_hint = null
    }
  }

  const { data, error } = await supabase
    .from("memos")
    .update(updatePayload)
    .eq("id", id)
    .eq("owner_id", viewerId)
    .select()
    .single()

  if (error) {
    logDatabaseError("Error updating memo state", { viewerId, memoId: id }, error)
    return { success: false, error: formatActionError("更新失败", error) }
  }

  if (!data) {
    const noDataError = "更新失败：数据库没有返回更新后的记录，可能这条 memo 不属于当前账号。"
    console.error("Error updating memo state: no row returned", {
      viewerId,
      memoId: id,
    })
    return { success: false, error: noDataError }
  }

  revalidatePath("/")
  return {
    success: true,
    error: null,
    data: enrichViewerMemo(data as Memo, viewerId),
  }
}

/**
 * 批量为笔记添加标签
 */
export async function batchAddTagsToMemos(formData: FormData): Promise<ActionResponse<Memo[]>> {
  if (!(await isAdmin())) {
    return { success: false, error: "权限不足，仅管理员可进行此操作" }
  }
  const viewerId = await getCurrentUserId()
  if (!viewerId) return { success: false, error: "请先登录" }

  const rawData = Object.fromEntries(formData.entries())
  const validation = batchAddTagsSchema.safeParse(rawData)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  const { ids, tags, removeTags } = validation.data
  const supabase = await getClient()

  const validIds = ids.filter(Boolean)
  const validTags = (tags || []).map((t) => t.trim()).filter(Boolean)
  const validRemoveTags = (removeTags || []).map((t) => t.trim()).filter(Boolean)

  if (validIds.length === 0 || (validTags.length === 0 && validRemoveTags.length === 0)) {
    return { success: true, data: [], error: null }
  }

  // 先拉取当前内容
  const { data: memos, error: fetchError } = await supabase
    .from("memos")
    .select("id, content, tags")
    .eq("owner_id", viewerId)
    .in("id", validIds)

  if (fetchError) return { success: false, error: "获取笔记失败" }

  const results = await Promise.all(
    memos.map((memo) => {
      // 1. 先安全剔除需要移除的标签
      const { content: intermediateContent, tags: intermediateTags } = removeTagsFromContent(
        memo.content || "",
        memo.tags || [],
        validRemoveTags
      )

      // 2. 再合并需要添加的新标签
      const { content: newContent, tags: combinedTags } = mergeTagsIntoContent(
        intermediateContent,
        intermediateTags,
        validTags
      )

      return supabase
        .from("memos")
        .update({
          tags: combinedTags,
          content: newContent,
          updated_at: new Date().toISOString(),
          word_count: calculateWordCount(newContent),
          locations: extractLocations(newContent) as unknown as MemoInsert["locations"],
        })
        .eq("id", memo.id)
        .select()
    })
  )

  const hasError = results.some((r) => r.error)
  if (hasError) return { success: false, error: "部分更新失败" }

  const updatedMemos = results.map((r) => r.data?.[0]).filter(Boolean) as Memo[]

  revalidatePath("/")
  return { success: true, data: updatedMemos, error: null }
}

export async function renameTagForCurrentUser(
  oldTag: string,
  newTag: string
): Promise<ActionResponse<{ count: number }>> {
  if (!(await isAdmin())) return { success: false, error: "权限不足，仅管理员可进行此操作" }
  const viewerId = await getCurrentUserId()
  const from = oldTag.trim()
  const to = newTag.trim()
  if (!viewerId) return { success: false, error: "请先登录" }
  if (!from || !to) return { success: false, error: "标签不能为空" }
  if (from === to) return { success: false, error: "新旧标签不能相同" }
  const supabase = await getClient()
  const { data: memos, error } = await supabase
    .from("memos")
    .select("id, content, tags")
    .eq("owner_id", viewerId)
    .contains("tags", [from])
  if (error) return { success: false, error: "获取标签记录失败" }
  const updates = (memos ?? []).map((memo) => {
    const content = renameTagInContent(memo.content ?? "", from, to)
    const tags = Array.from(new Set((memo.tags ?? []).map((tag) => (tag === from ? to : tag))))
    return {
      id: memo.id,
      owner_id: viewerId,
      content,
      tags,
      word_count: calculateWordCount(content),
      locations: extractLocations(content) as unknown as MemoInsert["locations"],
      updated_at: new Date().toISOString(),
    }
  })
  const results = await Promise.all(
    Array.from({ length: Math.ceil(updates.length / TAG_RENAME_BATCH_SIZE) }, (_, index) =>
      supabase
        .from("memos")
        .upsert(updates.slice(index * TAG_RENAME_BATCH_SIZE, (index + 1) * TAG_RENAME_BATCH_SIZE), {
          onConflict: "id",
        })
    )
  )
  if (results.some((result) => result.error)) return { success: false, error: "部分更新失败" }
  revalidatePath("/")
  revalidatePath("/tags")
  return { success: true, data: { count: memos?.length ?? 0 }, error: null }
}

/**
 * 解锁口令速率限制
 * 注意：这是进程内内存 Map，多实例部署时每个实例独立计数，
 * 不适合需要严格全局限流的场景。对于个人应用已足够。
 */
const VERIFY_RATE_WINDOW_MS = 60_000
const VERIFY_RATE_MAX = 5

const verifyTimestamps = new Map<string, number[]>()

// 仅用于测试：清除速率限制状态
export async function _resetVerifyTimestamps() {
  verifyTimestamps.clear()
}

function checkVerifyRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = verifyTimestamps.get(userId) ?? []
  const recent = timestamps.filter((t) => now - t < VERIFY_RATE_WINDOW_MS)
  if (recent.length >= VERIFY_RATE_MAX) {
    verifyTimestamps.set(userId, recent)
    return false
  }
  recent.push(now)
  verifyTimestamps.set(userId, recent)
  return true
}

/**
 * 验证解锁口令
 */
export async function verifyUnlockCode(
  memoId: string,
  code: string
): Promise<ActionResponse<Memo>> {
  if (!memoId) {
    return { success: false, error: "缺少 Memo ID" }
  }

  const viewerId = await getCurrentUserId()
  // 使用认证用户 ID 或未认证 IP（Server Action 中无法直接获取 IP，
  // 所以未认证用户共享全局限流键）来限速
  const rateKey = viewerId ?? "anonymous"

  if (!checkVerifyRateLimit(rateKey)) {
    return { success: false, error: "尝试次数过多，请稍后再试" }
  }

  const supabase = await getAdminClient()
  const { data, error } = await supabase
    .from("memos")
    .select(
      "id, memo_number, owner_id, content, tags, access_code_hint, is_private, is_pinned, pinned_at, created_at, updated_at, deleted_at, word_count, locations, images, access_code_hash"
    )
    .eq("id", memoId)
    .single()

  if (error || !data) {
    return { success: false, error: "记录不存在" }
  }

  if (viewerId && data.owner_id === viewerId) {
    return {
      success: true,
      error: null,
      data: withViewerAccess(data as unknown as Memo, viewerId, [memoId]) as Memo,
    }
  }

  if (!data.access_code_hash) {
    return { success: false, error: "未设置访问口令" }
  }

  const isValid = await bcrypt.compare(code, data.access_code_hash)
  if (!isValid) {
    return { success: false, error: "口令错误" }
  }

  return {
    success: true,
    error: null,
    data: withViewerAccess(data as unknown as Memo, viewerId, [memoId]) as Memo,
  }
}

// Alias for legacy usage
export const unlockWithCode = verifyUnlockCode

/**
 * 清除解锁口令
 */
export async function clearUnlockCode(): Promise<ActionResponse> {
  return { success: true, error: null }
}
