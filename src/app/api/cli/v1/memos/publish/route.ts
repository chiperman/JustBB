import { createMemoSchema } from "@/lib/memos/schemas"
import { getCliClient } from "@/server/services/cli/client"
import { CLI_ERROR_CODES, cliError, cliOk } from "@/server/services/cli/http"
import { createMemoRecord } from "@/server/services/memos/write"

export async function POST(request: Request) {
  const supabase = getCliClient(request)
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return cliError("请先执行 justmemo login", 401, CLI_ERROR_CODES.UNAUTHORIZED)
  }
  if (authData.user.app_metadata?.role !== "admin") {
    return cliError("权限不足，仅管理员可发布", 403, CLI_ERROR_CODES.ADMIN_ONLY)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return cliError("请求体必须是 JSON", 400, CLI_ERROR_CODES.INVALID_JSON)
  }

  const parsed = createMemoSchema.safeParse(body)
  if (!parsed.success) {
    return cliError(
      parsed.error.issues[0]?.message || "内容无效",
      400,
      CLI_ERROR_CODES.VALIDATION_FAILED
    )
  }

  const { content, images, image_metadata, is_private, is_pinned, access_code, access_code_hint } =
    parsed.data

  const result = await createMemoRecord(supabase, authData.user.id, {
    content,
    images,
    imageMetadata: image_metadata,
    isPrivate: is_private,
    isPinned: is_pinned,
    accessCode: access_code,
    accessCodeHint: access_code_hint,
  })

  if (!result.success) {
    if (result.reason === "private_requires_code") {
      return cliError("私密 Memo 必须设置访问口令", 400, CLI_ERROR_CODES.VALIDATION_FAILED)
    }
    if (result.reason === "empty_content") {
      return cliError("内容不能为空", 400, CLI_ERROR_CODES.VALIDATION_FAILED)
    }
    console.error("CLI memo publish failed:", result.dbError)
    return cliError("发布失败", 500, CLI_ERROR_CODES.INTERNAL)
  }

  const {
    id,
    memo_number,
    content: memoContent,
    tags,
    created_at,
    is_private: memoIsPrivate,
    is_pinned: memoIsPinned,
    access_code_hint: memoAccessCodeHint,
    word_count,
    images: memoImages,
  } = result.data
  return cliOk({
    id,
    memo_number,
    content: memoContent,
    tags,
    created_at,
    is_private: memoIsPrivate,
    is_pinned: memoIsPinned,
    access_code_hint: memoAccessCodeHint,
    word_count,
    images: memoImages,
  })
}
