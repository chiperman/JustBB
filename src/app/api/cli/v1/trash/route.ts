import { revalidatePath } from "next/cache"
import { deleteImagesFromR2WithConfig } from "@/server/services/r2"
import { requireCliAdmin } from "@/server/services/cli/admin"
import {
  CLI_ERROR_CODES,
  cliError,
  cliOk,
  parseCliLimit,
  parseCliPage,
} from "@/server/services/cli/http"

const MEMO_SELECT =
  "id, memo_number, content, tags, created_at, is_private, is_pinned, access_code_hint, word_count, images, deleted_at"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = parseCliLimit(url.searchParams.get("limit"))
  const page = parseCliPage(url.searchParams.get("page"))
  if (limit === null)
    return cliError("limit 必须是 1-100 之间的整数", 400, CLI_ERROR_CODES.INVALID_PARAMS)
  if (page === null)
    return cliError("page 必须是 1-10000 之间的整数", 400, CLI_ERROR_CODES.INVALID_PARAMS)

  const auth = await requireCliAdmin(request)
  if (!auth.user)
    return cliError(
      auth.error ?? "请先执行 justmemo login",
      auth.status,
      auth.code ?? CLI_ERROR_CODES.UNAUTHORIZED
    )

  const { data, error } = await auth.supabase
    .from("memos")
    .select(MEMO_SELECT)
    .eq("owner_id", auth.user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    console.error("CLI trash list failed:", error)
    return cliError("查询回收站失败", 500, CLI_ERROR_CODES.INTERNAL)
  }
  return cliOk(data || [])
}

export async function DELETE(request: Request) {
  const auth = await requireCliAdmin(request)
  if (!auth.user)
    return cliError(
      auth.error ?? "请先执行 justmemo login",
      auth.status,
      auth.code ?? CLI_ERROR_CODES.UNAUTHORIZED
    )

  const { data: memos, error: queryError } = await auth.supabase
    .from("memos")
    .select("id, images")
    .eq("owner_id", auth.user.id)
    .not("deleted_at", "is", null)

  if (queryError) return cliError("读取回收站失败", 500, CLI_ERROR_CODES.INTERNAL)
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
    return cliError("清空回收站失败", 500, CLI_ERROR_CODES.INTERNAL)
  }

  revalidatePath("/trash")
  return cliOk({ deleted_count: memos?.length || 0 })
}
