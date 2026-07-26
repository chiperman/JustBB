import { revalidatePath } from "next/cache"
import { deleteImagesFromR2WithConfig } from "@/server/services/r2"
import { requireCliAdmin } from "@/server/services/cli/admin"
import { CLI_ERROR_CODES, cliError, cliOk, isValidMemoNumber } from "@/server/services/cli/http"

type RouteContext = { params: Promise<{ memoNumber: string }> }

const MEMO_SELECT =
  "id, memo_number, content, tags, created_at, is_private, is_pinned, access_code_hint, word_count, images, deleted_at"

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
  if (!isValidMemoNumber(memoNumber))
    return cliError("无效的 Memo 编号", 400, CLI_ERROR_CODES.INVALID_MEMO_NUMBER)
  const { auth, memo } = await findTrashedMemo(request, memoNumber)
  if (!auth.user)
    return cliError(
      auth.error ?? "请先执行 justmemo login",
      auth.status,
      auth.code ?? CLI_ERROR_CODES.UNAUTHORIZED
    )
  if (!memo)
    return cliError(`没有找到回收站 Memo #${memoNumber}`, 404, CLI_ERROR_CODES.MEMO_NOT_FOUND)
  return cliOk(memo)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params
  if (!isValidMemoNumber(memoNumber))
    return cliError("无效的 Memo 编号", 400, CLI_ERROR_CODES.INVALID_MEMO_NUMBER)
  const { auth, memo } = await findTrashedMemo(request, memoNumber)
  if (!auth.user)
    return cliError(
      auth.error ?? "请先执行 justmemo login",
      auth.status,
      auth.code ?? CLI_ERROR_CODES.UNAUTHORIZED
    )
  if (!memo)
    return cliError(`没有找到回收站 Memo #${memoNumber}`, 404, CLI_ERROR_CODES.MEMO_NOT_FOUND)

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
  if (error) return cliError("永久删除 Memo 失败", 500, CLI_ERROR_CODES.INTERNAL)

  revalidatePath("/trash")
  return cliOk({ memo_number: Number(memoNumber) })
}
