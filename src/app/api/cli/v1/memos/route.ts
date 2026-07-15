import { NextResponse } from "next/server"
import { Json } from "@/types/database"
import { getCliReadClient } from "@/server/services/cli/client"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const DEFAULT_PAGE = 1
const MAX_PAGE = 10000

function jsonResponse<T>(success: boolean, data: T, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status })
}

function parseLimit(value: string | null) {
  if (value === null || value === "") return DEFAULT_LIMIT

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) return null
  return parsed
}

function parsePage(value: string | null) {
  if (value === null || value === "") return DEFAULT_PAGE

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE) return null
  return parsed
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = parseLimit(url.searchParams.get("limit"))
  const page = parsePage(url.searchParams.get("page"))

  if (limit === null) {
    return jsonResponse(false, null, `limit 必须是 1-${MAX_LIMIT} 之间的整数`, 400)
  }
  if (page === null) {
    return jsonResponse(false, null, `page 必须是 1-${MAX_PAGE} 之间的整数`, 400)
  }

  const queryText = url.searchParams.get("q") || ""
  const tag = url.searchParams.get("tag")
  const memoNumber = url.searchParams.get("num")
  const filters: Record<string, string> = {}

  if (tag) filters.tag = tag
  if (memoNumber) filters.num = memoNumber

  const { data, error } = await (
    await getCliReadClient(request)
  ).rpc("search_memos_secure", {
    query_text: queryText,
    unlocked_ids: [],
    limit_val: limit,
    offset_val: (page - 1) * limit,
    filters: filters as unknown as Json,
    sort_order: "newest",
  })

  if (error) {
    console.error("CLI memo search failed:", error)
    return jsonResponse(false, null, "查询失败", 500)
  }

  return jsonResponse(true, data || [], null)
}
