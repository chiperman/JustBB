import { Json } from "@/types/database"
import { getCliReadClient } from "@/server/services/cli/client"
import {
  CLI_ERROR_CODES,
  CLI_MAX_LIMIT,
  CLI_MAX_PAGE,
  cliError,
  cliOk,
  parseCliLimit,
  parseCliPage,
} from "@/server/services/cli/http"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = parseCliLimit(url.searchParams.get("limit"))
  const page = parseCliPage(url.searchParams.get("page"))

  if (limit === null) {
    return cliError(
      `limit 必须是 1-${CLI_MAX_LIMIT} 之间的整数`,
      400,
      CLI_ERROR_CODES.INVALID_PARAMS
    )
  }
  if (page === null) {
    return cliError(`page 必须是 1-${CLI_MAX_PAGE} 之间的整数`, 400, CLI_ERROR_CODES.INVALID_PARAMS)
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
    return cliError("查询失败", 500, CLI_ERROR_CODES.INTERNAL)
  }

  return cliOk(data || [])
}
