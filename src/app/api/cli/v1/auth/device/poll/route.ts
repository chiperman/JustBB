import { getAdminClient } from "@/lib/supabase"
import { decryptDeviceToken, hashDeviceCode } from "@/server/services/cli/device"
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

  const admin = getAdminClient()
  const { data: device, error } = await admin
    .from("cli_device_sessions")
    .select("id, status, expires_at, access_token, refresh_token")
    .eq("id", requestId)
    .eq("code_hash", hashDeviceCode(code))
    .maybeSingle()

  if (error || !device) {
    return cliError("授权请求不存在", 404, CLI_ERROR_CODES.NOT_FOUND)
  }

  if (device.status === "pending" && new Date(device.expires_at).getTime() <= Date.now()) {
    await admin.from("cli_device_sessions").update({ status: "expired" }).eq("id", requestId)
    return cliError("授权码已过期", 410, CLI_ERROR_CODES.EXPIRED)
  }

  if (device.status === "pending") {
    return cliOk({ status: "pending", expires_at: device.expires_at })
  }

  if (device.status === "denied") {
    return cliError("CLI access is restricted to administrators.", 403, CLI_ERROR_CODES.ADMIN_ONLY)
  }

  if (device.status !== "approved" || !device.access_token || !device.refresh_token) {
    return cliError("授权请求不可用", 409, CLI_ERROR_CODES.CONFLICT)
  }

  const { data: consumed } = await admin
    .from("cli_device_sessions")
    .update({ status: "consumed", consumed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "approved")
    .select("access_token, refresh_token")
    .maybeSingle()

  if (!consumed?.access_token || !consumed.refresh_token) {
    return cliError("授权请求已被领取", 409, CLI_ERROR_CODES.CONFLICT)
  }

  try {
    return cliOk({
      status: "approved",
      access_token: decryptDeviceToken(consumed.access_token),
      refresh_token: decryptDeviceToken(consumed.refresh_token),
    })
  } catch (decryptError) {
    console.error("CLI device token decryption failed:", decryptError)
    return cliError("授权令牌无效", 500, CLI_ERROR_CODES.INTERNAL)
  }
}
