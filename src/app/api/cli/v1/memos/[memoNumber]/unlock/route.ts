import { getAdminClient } from "@/lib/supabase"
import { verifyUnlockCode } from "@/server/actions/memos/mutate"
import { CLI_ERROR_CODES, cliError, cliOk, isValidMemoNumber } from "@/server/services/cli/http"

type RouteContext = {
  params: Promise<{ memoNumber: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params

  if (!isValidMemoNumber(memoNumber)) {
    return cliError("无效的 Memo 编号", 400, CLI_ERROR_CODES.INVALID_MEMO_NUMBER)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return cliError("请求体必须是 JSON", 400, CLI_ERROR_CODES.INVALID_JSON)
  }

  const code =
    typeof body === "object" && body !== null && "code" in body
      ? (body as { code?: unknown }).code
      : undefined

  if (typeof code !== "string" || code.length === 0) {
    return cliError("缺少解锁口令", 400, CLI_ERROR_CODES.VALIDATION_FAILED)
  }

  const { data, error } = await getAdminClient()
    .from("memos")
    .select("id")
    .eq("memo_number", Number(memoNumber))
    .maybeSingle()

  if (error || !data) {
    return cliError(`没有找到 Memo #${memoNumber}`, 404, CLI_ERROR_CODES.MEMO_NOT_FOUND)
  }

  const result = await verifyUnlockCode(data.id, code)
  if (!result.success) {
    const rateLimited = result.error === "尝试次数过多，请稍后再试"
    return cliError(
      result.error || "解锁失败",
      rateLimited ? 429 : 401,
      rateLimited ? CLI_ERROR_CODES.RATE_LIMITED : CLI_ERROR_CODES.UNAUTHORIZED
    )
  }

  return cliOk(result.data)
}
