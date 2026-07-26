import { revalidatePath } from "next/cache"
import { requireCliAdmin } from "@/server/services/cli/admin"
import { CLI_ERROR_CODES, cliError, cliOk, isValidMemoNumber } from "@/server/services/cli/http"

type RouteContext = { params: Promise<{ memoNumber: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const { memoNumber } = await params
  if (!isValidMemoNumber(memoNumber)) {
    return cliError("无效的 Memo 编号", 400, CLI_ERROR_CODES.INVALID_MEMO_NUMBER)
  }

  const auth = await requireCliAdmin(request)
  if (!auth.user)
    return cliError(
      auth.error ?? "请先执行 justmemo login",
      auth.status,
      auth.code ?? CLI_ERROR_CODES.UNAUTHORIZED
    )

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

  if (error) return cliError("恢复 Memo 失败", 500, CLI_ERROR_CODES.INTERNAL)
  if (!data)
    return cliError(`没有找到回收站 Memo #${memoNumber}`, 404, CLI_ERROR_CODES.MEMO_NOT_FOUND)

  revalidatePath("/")
  revalidatePath("/trash")
  return cliOk(data)
}
