import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { deleteImagesFromR2WithConfig } from "@/server/services/r2"
import { requireCliAdmin } from "@/server/services/cli/admin"

const MEMO_SELECT =
  "id, memo_number, content, tags, created_at, is_private, is_pinned, access_code_hint, word_count, images, deleted_at"

function jsonResponse<T>(success: boolean, data: T, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status })
}

function parsePage(value: string | null, defaultValue: number, max: number) {
  if (!value) return defaultValue
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = parsePage(url.searchParams.get("limit"), 20, 100)
  const page = parsePage(url.searchParams.get("page"), 1, 10000)
  if (limit === null) return jsonResponse(false, null, "limit 必须是 1-100 之间的整数", 400)
  if (page === null) return jsonResponse(false, null, "page 必须是 1-10000 之间的整数", 400)

  const auth = await requireCliAdmin(request)
  if (!auth.user) return jsonResponse(false, null, auth.error, auth.status)

  const { data, error } = await auth.supabase
    .from("memos")
    .select(MEMO_SELECT)
    .eq("owner_id", auth.user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    console.error("CLI trash list failed:", error)
    return jsonResponse(false, null, "查询回收站失败", 500)
  }
  return jsonResponse(true, data || [], null)
}

export async function DELETE(request: Request) {
  const auth = await requireCliAdmin(request)
  if (!auth.user) return jsonResponse(false, null, auth.error, auth.status)

  const { data: memos, error: queryError } = await auth.supabase
    .from("memos")
    .select("id, images")
    .eq("owner_id", auth.user.id)
    .not("deleted_at", "is", null)

  if (queryError) return jsonResponse(false, null, "读取回收站失败", 500)
  const allImages = (memos || []).flatMap((memo) => memo.images || [])
  if (allImages.length > 0) {
    const { data: config } = await auth.supabase
      .from("r2_configs")
      .select("account_id, access_key_id, secret_access_key, bucket_name")
      .eq("user_id", auth.user.id)
      .maybeSingle()
    if (config) await deleteImagesFromR2WithConfig(allImages, config)
  }

  const { error } = await auth.supabase
    .from("memos")
    .delete()
    .eq("owner_id", auth.user.id)
    .not("deleted_at", "is", null)
  if (error) {
    console.error("CLI empty trash failed:", error)
    return jsonResponse(false, null, "清空回收站失败", 500)
  }

  revalidatePath("/trash")
  return jsonResponse(true, { deleted_count: memos?.length || 0 }, null)
}
