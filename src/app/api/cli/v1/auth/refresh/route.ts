import { getCliAuthClient } from "@/server/services/cli/client"
import { CLI_ERROR_CODES, cliError, cliOk } from "@/server/services/cli/http"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return cliError("请求体必须是 JSON", 400, CLI_ERROR_CODES.INVALID_JSON)
  }

  const refreshToken =
    typeof body === "object" && body !== null && "refresh_token" in body
      ? (body as { refresh_token?: unknown }).refresh_token
      : undefined

  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    return cliError("缺少 refresh_token", 400, CLI_ERROR_CODES.INVALID_PARAMS)
  }

  const { data, error } = await getCliAuthClient().auth.refreshSession({
    refresh_token: refreshToken,
  })
  if (error || !data.session) {
    return cliError("登录已失效，请重新登录", 401, CLI_ERROR_CODES.UNAUTHORIZED)
  }

  const { data: userData, error: userError } = await getCliAuthClient().auth.getUser(
    data.session.access_token
  )
  if (userError || userData.user?.app_metadata?.role !== "admin") {
    return cliError("CLI access is restricted to administrators.", 403, CLI_ERROR_CODES.ADMIN_ONLY)
  }

  return cliOk({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  })
}
