import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase"
import { verifyUnlockCode } from "@/server/actions/memos/mutate"

type RouteContext = {
  params: Promise<{ memoNumber: string }>
}

function jsonResponse<T>(success: boolean, data: T, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params

  if (!/^\d+$/.test(memoNumber) || Number(memoNumber) < 1) {
    return jsonResponse(false, null, "无效的 Memo 编号", 400)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse(false, null, "请求体必须是 JSON", 400)
  }

  const code =
    typeof body === "object" && body !== null && "code" in body
      ? (body as { code?: unknown }).code
      : undefined

  if (typeof code !== "string" || code.length === 0) {
    return jsonResponse(false, null, "缺少解锁口令", 400)
  }

  const { data, error } = await getAdminClient()
    .from("memos")
    .select("id")
    .eq("memo_number", Number(memoNumber))
    .maybeSingle()

  if (error || !data) {
    return jsonResponse(false, null, `没有找到 Memo #${memoNumber}`, 404)
  }

  const result = await verifyUnlockCode(data.id, code)
  if (!result.success) {
    const status = result.error === "尝试次数过多，请稍后再试" ? 429 : 401
    return jsonResponse(false, null, result.error || "解锁失败", status)
  }

  return jsonResponse(true, result.data, null)
}
