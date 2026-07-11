import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireCliAdmin } from "@/server/services/cli/admin"

type RouteContext = { params: Promise<{ memoNumber: string }> }

function jsonResponse<T>(success: boolean, data: T, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params
  if (!/^\d+$/.test(memoNumber) || Number(memoNumber) < 1) {
    return jsonResponse(false, null, "无效的 Memo 编号", 400)
  }

  const auth = await requireCliAdmin(request)
  if (!auth.user) return jsonResponse(false, null, auth.error, auth.status)

  const { data, error } = await auth.supabase
    .from("memos")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("memo_number", Number(memoNumber))
    .eq("owner_id", auth.user.id)
    .not("deleted_at", "is", null)
    .select(
      "id, memo_number, content, tags, created_at, is_private, is_pinned, access_code_hint, word_count, images"
    )
    .maybeSingle()

  if (error) return jsonResponse(false, null, "恢复 Memo 失败", 500)
  if (!data) return jsonResponse(false, null, `没有找到回收站 Memo #${memoNumber}`, 404)

  revalidatePath("/")
  revalidatePath("/trash")
  return jsonResponse(true, data, null)
}
