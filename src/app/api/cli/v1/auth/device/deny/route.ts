import { getAdminClient, getClient } from "@/lib/supabase"
import { CLI_ERROR_CODES, cliError, cliOk } from "@/server/services/cli/http"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return cliError("请求体必须是 JSON", 400, CLI_ERROR_CODES.INVALID_JSON)
  }

  const requestId =
    typeof body === "object" && body !== null && "request_id" in body
      ? (body as { request_id?: unknown }).request_id
      : undefined
  if (typeof requestId !== "string") {
    return cliError("授权请求参数不完整", 400, CLI_ERROR_CODES.INVALID_PARAMS)
  }

  const { data: userData } = await (await getClient()).auth.getUser()
  if (!userData.user) {
    return cliError("请先登录 JustMemo", 401, CLI_ERROR_CODES.UNAUTHORIZED)
  }
  if (userData.user.app_metadata?.role === "admin") {
    return cliError("管理员不能拒绝 CLI 授权请求", 403, CLI_ERROR_CODES.FORBIDDEN)
  }

  const { error } = await getAdminClient()
    .from("cli_device_sessions")
    .update({ status: "denied" })
    .eq("id", requestId)
    .eq("status", "pending")

  if (error) {
    return cliError("拒绝授权失败", 500, CLI_ERROR_CODES.INTERNAL)
  }

  return cliOk({ status: "denied" })
}
