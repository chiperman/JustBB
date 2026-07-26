import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { createMemoSchema } from "@/lib/memos/schemas"
import { extractImagesFromContent } from "@/lib/memos/parser"
import { buildMemoPayload } from "@/server/actions/memos/helpers"
import { getCliClient } from "@/server/services/cli/client"
import { CLI_ERROR_CODES, cliError, cliOk } from "@/server/services/cli/http"
import type { Database } from "@/types/database"

type MemoInsert = Database["public"]["Tables"]["memos"]["Insert"]

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
  if (is_private && !access_code) {
    return cliError("私密 Memo 必须设置访问口令", 400, CLI_ERROR_CODES.VALIDATION_FAILED)
  }
  const normalized = extractImagesFromContent(content, images)
  const payload: MemoInsert = {
    owner_id: authData.user.id,
    is_private,
    is_pinned,
    images: normalized.images,
    image_metadata,
    ...buildMemoPayload(normalized.content, { isPinned: is_pinned }),
  }

  if (is_private && access_code) {
    payload.access_code_hash = await bcrypt.hash(access_code, await bcrypt.genSalt(10))
    payload.access_code_hint = access_code_hint || null
  }

  const { data, error } = await supabase
    .from("memos")
    .insert(payload)
    .select(
      "id, memo_number, content, tags, created_at, is_private, is_pinned, access_code_hint, word_count, images"
    )
    .single()

  if (error || !data) {
    console.error("CLI memo publish failed:", error)
    return cliError("发布失败", 500, CLI_ERROR_CODES.INTERNAL)
  }

  revalidatePath("/")
  revalidatePath("/gallery")
  return cliOk(data)
}
