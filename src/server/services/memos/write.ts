import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/types/database"
import { extractImagesFromContent } from "@/lib/memos/parser"
import { buildMemoPayload } from "@/server/actions/memos/helpers"

/**
 * 「写一条 memo」的深 module：normalize、派生字段、口令哈希、落库和缓存失效
 * 的唯一实现。Web server action（FormData）和 CLI route（JSON）都是入口
 * adapter，传入已绑定身份的 supabase client 和 owner_id。
 *
 * 本 module 不做鉴权——鉴权上下文两侧不同（cookie session vs bearer token），
 * 由入口各自处理。
 */

type MemoInsert = Database["public"]["Tables"]["memos"]["Insert"]
type MemoUpdate = Database["public"]["Tables"]["memos"]["Update"]
type MemoRow = Database["public"]["Tables"]["memos"]["Row"]
type MemosClient = SupabaseClient<Database>

export type ImageMetadataInput = Record<string, { width: number; height: number }>

export type WriteMemoDbError = {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}

export type WriteMemoFailureReason =
  | "empty_content"
  | "private_requires_code"
  | "nothing_to_update"
  | "not_found"
  | "db"

export type WriteMemoResult =
  | { success: true; data: MemoRow }
  | { success: false; reason: WriteMemoFailureReason; dbError?: WriteMemoDbError | null }

export type CreateMemoInput = {
  content: string
  images?: string[]
  imageMetadata?: ImageMetadataInput
  isPrivate: boolean
  isPinned: boolean
  accessCode?: string | null
  accessCodeHint?: string | null
}

export type UpdateMemoContentInput = {
  id: string
  content?: string
  images?: string[]
  imageMetadata?: ImageMetadataInput
}

function invalidateMemoPages() {
  revalidatePath("/")
  revalidatePath("/gallery")
}

function toJsonMetadata(images: string[], metadata: ImageMetadataInput): Json {
  return Object.fromEntries(
    images
      .map((url) => {
        const item = metadata[url]
        if (!item) return null
        return [url, { width: item.width, height: item.height }]
      })
      .filter((entry): entry is [string, { width: number; height: number }] => Boolean(entry))
  ) as Json
}

/** 调用方提供的元数据优先，缺失的保留服务端已有元数据。 */
function mergeImageMetadata(
  images: string[],
  provided: ImageMetadataInput | undefined,
  existing: ImageMetadataInput
): Json {
  const merged: ImageMetadataInput = { ...existing, ...provided }
  return toJsonMetadata(images, merged)
}

async function hashAccessCode(accessCode: string) {
  return bcrypt.hash(accessCode, await bcrypt.genSalt(10))
}

export async function createMemoRecord(
  supabase: MemosClient,
  ownerId: string,
  input: CreateMemoInput
): Promise<WriteMemoResult> {
  const normalized = extractImagesFromContent(input.content, input.images ?? [])
  if (!normalized.content.trim() && normalized.images.length === 0) {
    return { success: false, reason: "empty_content" }
  }
  if (input.isPrivate && !input.accessCode) {
    return { success: false, reason: "private_requires_code" }
  }

  const payload: MemoInsert = {
    owner_id: ownerId,
    is_private: input.isPrivate,
    images: normalized.images,
    image_metadata: toJsonMetadata(normalized.images, input.imageMetadata ?? {}),
    ...buildMemoPayload(normalized.content, { isPinned: input.isPinned }),
  }

  if (input.isPrivate && input.accessCode) {
    payload.access_code_hash = await hashAccessCode(input.accessCode)
    payload.access_code_hint = input.accessCodeHint || null
  }

  const { data, error } = await supabase.from("memos").insert(payload).select().single()

  if (error || !data) {
    return { success: false, reason: "db", dbError: error }
  }

  invalidateMemoPages()
  return { success: true, data }
}

export async function updateMemoContentRecord(
  supabase: MemosClient,
  ownerId: string,
  input: UpdateMemoContentInput
): Promise<WriteMemoResult> {
  if (input.content === undefined && input.images === undefined) {
    return { success: false, reason: "nothing_to_update" }
  }

  // 读取现有记录：内容更新需要沿用未重传的图片，并保留客户端未提供的图片元数据。
  const { data: existing } = await supabase
    .from("memos")
    .select("id, images, image_metadata")
    .eq("id", input.id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (!existing) {
    return { success: false, reason: "not_found", dbError: { code: "PGRST116" } }
  }

  const existingMetadata = (existing.image_metadata ?? {}) as ImageMetadataInput
  const update: MemoUpdate = { updated_at: new Date().toISOString() }

  if (input.content !== undefined) {
    const baseImages = input.images ?? existing.images ?? []
    const normalized = extractImagesFromContent(input.content, baseImages)
    if (!normalized.content.trim() && normalized.images.length === 0) {
      return { success: false, reason: "empty_content" }
    }
    Object.assign(update, buildMemoPayload(normalized.content), {
      images: normalized.images,
      image_metadata: mergeImageMetadata(normalized.images, input.imageMetadata, existingMetadata),
    })
  } else if (input.images !== undefined) {
    update.images = input.images
    update.image_metadata = mergeImageMetadata(input.images, input.imageMetadata, existingMetadata)
  }

  const { data, error } = await supabase
    .from("memos")
    .update(update)
    .eq("id", input.id)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error || !data) {
    return { success: false, reason: "db", dbError: error }
  }

  invalidateMemoPages()
  return { success: true, data }
}
