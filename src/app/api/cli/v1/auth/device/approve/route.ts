import { getClient, getAdminClient } from "@/lib/supabase"
import { encryptDeviceToken, hashDeviceCode } from "@/server/services/cli/device"
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
  const code =
    typeof body === "object" && body !== null && "code" in body
      ? (body as { code?: unknown }).code
      : undefined

  if (typeof requestId !== "string" || typeof code !== "string") {
    return cliError("授权请求参数不完整", 400, CLI_ERROR_CODES.INVALID_PARAMS)
  }

  const supabase = await getClient()
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ])

  if (!userData.user || !sessionData.session) {
    return cliError("请先登录 JustMemo", 401, CLI_ERROR_CODES.UNAUTHORIZED)
  }

  const admin = getAdminClient()
  const { data: device, error: lookupError } = await admin
    .from("cli_device_sessions")
    .select("id, status, expires_at")
    .eq("id", requestId)
    .eq("code_hash", hashDeviceCode(code))
    .maybeSingle()

  if (lookupError || !device) {
    return cliError("授权码无效", 400, CLI_ERROR_CODES.VALIDATION_FAILED)
  }
  if (device.status !== "pending" || new Date(device.expires_at).getTime() <= Date.now()) {
    return cliError("授权码已过期或已使用", 400, CLI_ERROR_CODES.EXPIRED)
  }

  if (userData.user.app_metadata?.role !== "admin") {
    const { error: denialError } = await admin
      .from("cli_device_sessions")
      .update({ status: "denied" })
      .eq("id", device.id)
      .eq("status", "pending")

    if (denialError) {
      return cliError("Authorization failed.", 500, CLI_ERROR_CODES.INTERNAL)
    }

    return cliError("CLI access is restricted to administrators.", 403, CLI_ERROR_CODES.ADMIN_ONLY)
  }

  const { error } = await admin
    .from("cli_device_sessions")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: userData.user.id,
      access_token: encryptDeviceToken(sessionData.session.access_token),
      refresh_token: encryptDeviceToken(sessionData.session.refresh_token),
    })
    .eq("id", requestId)
    .eq("status", "pending")

  if (error) {
    return cliError("授权失败", 500, CLI_ERROR_CODES.INTERNAL)
  }

  return cliOk({ status: "approved" })
}
