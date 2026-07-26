import { getCliClient } from "@/server/services/cli/client"
import { CLI_ERROR_CODES, cliError, cliOk } from "@/server/services/cli/http"

export async function GET(request: Request) {
  const { data, error } = await getCliClient(request).auth.getUser()
  if (error || !data.user) {
    return cliError("未登录", 401, CLI_ERROR_CODES.UNAUTHORIZED)
  }
  if (data.user.app_metadata?.role !== "admin") {
    return cliError("CLI access is restricted to administrators.", 403, CLI_ERROR_CODES.ADMIN_ONLY)
  }

  return cliOk({
    id: data.user.id,
    email: data.user.email,
    role: data.user.app_metadata?.role || "user",
  })
}
