import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { deleteImagesFromR2WithConfig } from "@/server/services/r2"
import { requireCliAdmin } from "@/server/services/cli/admin"

type RouteContext = { params: Promise<{ memoNumber: string }> }

const MEMO_SELECT =
  "id, memo_number, content, tags, created_at, is_private, is_pinned, access_code_hint, word_count, images, deleted_at"

function jsonResponse<T>(success: boolean, data: T, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status })
}

function validMemoNumber(value: string) {
  return /^\d+$/.test(value) && Number(value) >= 1
}

async function findTrashedMemo(request: Request, memoNumber: string) {
  const auth = await requireCliAdmin(request)
  if (!auth.user) return { auth, memo: null }
  const { data, error } = await auth.supabase
    .from("memos")
    .select(MEMO_SELECT)
    .eq("memo_number", Number(memoNumber))
    .eq("owner_id", auth.user.id)
    .not("deleted_at", "is", null)
    .maybeSingle()
  return { auth, memo: error ? null : data }
}

export async function GET(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params
  if (!validMemoNumber(memoNumber)) return jsonResponse(false, null, "无效的 Memo 编号", 400)
  const { auth, memo } = await findTrashedMemo(request, memoNumber)
  if (!auth.user) return jsonResponse(false, null, auth.error, auth.status)
  if (!memo) return jsonResponse(false, null, `没有找到回收站 Memo #${memoNumber}`, 404)
  return jsonResponse(true, memo, null)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params
  if (!validMemoNumber(memoNumber)) return jsonResponse(false, null, "无效的 Memo 编号", 400)
  const { auth, memo } = await findTrashedMemo(request, memoNumber)
  if (!auth.user) return jsonResponse(false, null, auth.error, auth.status)
  if (!memo) return jsonResponse(false, null, `没有找到回收站 Memo #${memoNumber}`, 404)

  if (memo.images?.length) {
    const { data: config } = await auth.supabase
      .from("r2_configs")
      .select("account_id, access_key_id, secret_access_key, bucket_name")
      .eq("user_id", auth.user.id)
      .maybeSingle()
    if (config) await deleteImagesFromR2WithConfig(memo.images, config)
  }

  const { error } = await auth.supabase
    .from("memos")
    .delete()
    .eq("id", memo.id)
    .eq("owner_id", auth.user.id)
  if (error) return jsonResponse(false, null, "永久删除 Memo 失败", 500)

  revalidatePath("/trash")
  return jsonResponse(true, { memo_number: Number(memoNumber) }, null)
}
