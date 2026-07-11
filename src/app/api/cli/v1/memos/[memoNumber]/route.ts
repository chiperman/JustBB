import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { Json } from "@/types/database"
import type { Database } from "@/types/database"
import { extractImagesFromContent } from "@/lib/memos/parser"
import { buildMemoPayload } from "@/server/actions/memos/helpers"
import { requireCliAdmin } from "@/server/services/cli/admin"
import { getCliClient } from "@/server/services/cli/client"

type RouteContext = {
  params: Promise<{ memoNumber: string }>
}

function jsonResponse<T>(success: boolean, data: T, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status })
}

const MEMO_SELECT =
  "id, memo_number, content, images, image_metadata, is_private, is_pinned, access_code_hint, tags, created_at, word_count"

type MemoUpdate = Database["public"]["Tables"]["memos"]["Update"]

function retainImageMetadata(images: string[], metadata: Record<string, unknown>) {
  return Object.fromEntries(images.map((url) => [url, metadata[url]]).filter(([, value]) => value))
}

async function requireAdmin(request: Request) {
  const auth = await requireCliAdmin(request)
  return {
    supabase: auth.supabase,
    user: auth.user,
    response: auth.user ? null : jsonResponse(false, null, auth.error, auth.status),
  }
}

function validMemoNumber(value: string) {
  return /^\d+$/.test(value) && Number(value) >= 1
}

async function findActiveOwnedMemo(
  request: Request,
  memoNumber: string
): Promise<
  | { response: NextResponse; memo: null; supabase: ReturnType<typeof getCliClient>; userId: null }
  | {
      response: null
      memo: { id: string; images: string[]; image_metadata: Record<string, unknown> }
      supabase: ReturnType<typeof getCliClient>
      userId: string
    }
> {
  const auth = await requireAdmin(request)
  if (auth.response || !auth.user) {
    return {
      response: auth.response as NextResponse,
      memo: null,
      supabase: auth.supabase,
      userId: null,
    }
  }

  const { data, error } = await auth.supabase
    .from("memos")
    .select("id, images, image_metadata")
    .eq("memo_number", Number(memoNumber))
    .eq("owner_id", auth.user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (error || !data) {
    return {
      response: jsonResponse(false, null, `没有找到 Memo #${memoNumber}`, 404),
      memo: null,
      supabase: auth.supabase,
      userId: null,
    }
  }

  return {
    response: null,
    memo: {
      id: data.id,
      images: data.images || [],
      image_metadata: (data.image_metadata || {}) as Record<string, unknown>,
    },
    supabase: auth.supabase,
    userId: auth.user.id,
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params

  if (!validMemoNumber(memoNumber)) {
    return jsonResponse(false, null, "无效的 Memo 编号", 400)
  }

  const { data, error } = await getCliClient(request).rpc("search_memos_secure", {
    query_text: "",
    unlocked_ids: [],
    limit_val: 1,
    offset_val: 0,
    filters: { num: memoNumber } as unknown as Json,
    sort_order: "newest",
  })

  if (error) {
    console.error("CLI memo lookup failed:", error)
    return jsonResponse(false, null, "查询失败", 500)
  }

  const memo = data?.[0]
  if (!memo) {
    return jsonResponse(false, null, `没有找到 Memo #${memoNumber}`, 404)
  }

  return jsonResponse(true, memo, null)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params
  if (!validMemoNumber(memoNumber)) return jsonResponse(false, null, "无效的 Memo 编号", 400)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse(false, null, "请求体必须是 JSON", 400)
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(false, null, "请求体必须是对象", 400)
  }

  const input = body as Record<string, unknown>
  const allowedKeys = [
    "content",
    "images",
    "is_pinned",
    "is_private",
    "access_code",
    "access_code_hint",
  ]
  if (Object.keys(input).some((key) => !allowedKeys.includes(key))) {
    return jsonResponse(false, null, "包含不支持的更新字段", 400)
  }
  if (Object.keys(input).length === 0) return jsonResponse(false, null, "没有可更新的字段", 400)
  if (input.content !== undefined && typeof input.content !== "string") {
    return jsonResponse(false, null, "content 必须是字符串", 400)
  }
  if (
    input.images !== undefined &&
    (!Array.isArray(input.images) || input.images.some((item) => typeof item !== "string"))
  ) {
    return jsonResponse(false, null, "images 必须是字符串数组", 400)
  }
  if (input.is_pinned !== undefined && typeof input.is_pinned !== "boolean") {
    return jsonResponse(false, null, "is_pinned 必须是布尔值", 400)
  }
  if (input.is_private !== undefined && typeof input.is_private !== "boolean") {
    return jsonResponse(false, null, "is_private 必须是布尔值", 400)
  }
  if (input.access_code !== undefined && typeof input.access_code !== "string") {
    return jsonResponse(false, null, "access_code 必须是字符串", 400)
  }
  if (input.access_code_hint !== undefined && typeof input.access_code_hint !== "string") {
    return jsonResponse(false, null, "access_code_hint 必须是字符串", 400)
  }
  if (input.is_private === true && (!input.access_code || typeof input.access_code !== "string")) {
    return jsonResponse(false, null, "私密 Memo 必须设置访问口令", 400)
  }

  const found = await findActiveOwnedMemo(request, memoNumber)
  if (found.response || !found.memo) return found.response as NextResponse

  const update: MemoUpdate = { updated_at: new Date().toISOString() }
  if (input.content !== undefined) {
    const images = (input.images as string[] | undefined) || found.memo.images
    const normalized = extractImagesFromContent(input.content as string, images)
    if (!normalized.content.trim() && normalized.images.length === 0) {
      return jsonResponse(false, null, "内容不能为空", 400)
    }
    Object.assign(update, buildMemoPayload(normalized.content), {
      images: normalized.images,
      image_metadata: retainImageMetadata(normalized.images, found.memo.image_metadata),
    })
  } else if (input.images !== undefined) {
    update.images = input.images as string[]
    update.image_metadata = retainImageMetadata(input.images as string[], found.memo.image_metadata)
  }

  if (input.is_pinned !== undefined) {
    update.is_pinned = input.is_pinned as boolean
    update.pinned_at = input.is_pinned ? new Date().toISOString() : null
  }
  if (input.is_private === true) {
    update.is_private = true
    update.access_code_hash = await bcrypt.hash(
      input.access_code as string,
      await bcrypt.genSalt(10)
    )
    update.access_code_hint = (input.access_code_hint as string | undefined) || null
  } else if (input.is_private === false) {
    update.is_private = false
    update.access_code_hash = null
    update.access_code_hint = null
  }

  const { data, error } = await found.supabase
    .from("memos")
    .update(update)
    .eq("id", found.memo.id)
    .eq("owner_id", found.userId)
    .select(MEMO_SELECT)
    .single()

  if (error || !data) {
    console.error("CLI memo update failed:", error)
    return jsonResponse(false, null, "更新 Memo 失败", 500)
  }

  revalidatePath("/")
  revalidatePath("/gallery")
  return jsonResponse(true, data, null)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params
  if (!validMemoNumber(memoNumber)) return jsonResponse(false, null, "无效的 Memo 编号", 400)

  const found = await findActiveOwnedMemo(request, memoNumber)
  if (found.response || !found.memo) return found.response as NextResponse

  const { error } = await found.supabase
    .from("memos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", found.memo.id)
    .eq("owner_id", found.userId)

  if (error) {
    console.error("CLI memo delete failed:", error)
    return jsonResponse(false, null, "删除 Memo 失败", 500)
  }

  revalidatePath("/")
  revalidatePath("/trash")
  return jsonResponse(true, { memo_number: Number(memoNumber) }, null)
}
