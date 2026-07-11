import { NextResponse } from "next/server"
import { Json } from "@/types/database"
import { getCliClient } from "@/server/services/cli/client"

type RouteContext = {
  params: Promise<{ memoNumber: string }>
}

function jsonResponse<T>(success: boolean, data: T, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status })
}

export async function GET(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params

  if (!/^\d+$/.test(memoNumber) || Number(memoNumber) < 1) {
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
