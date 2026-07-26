import { getCliClient } from "./client"
import { CLI_ERROR_CODES, type CliErrorCode } from "./http"

export async function requireCliAdmin(request: Request) {
  const supabase = getCliClient(request)
  const { data, error } = await supabase.auth.getUser()
  const user = data.user

  if (error || !user) {
    return {
      supabase,
      user: null,
      error: "请先执行 justmemo login",
      status: 401,
      code: CLI_ERROR_CODES.UNAUTHORIZED as CliErrorCode,
    }
  }
  if (user.app_metadata?.role !== "admin") {
    return {
      supabase,
      user: null,
      error: "权限不足，仅管理员可操作",
      status: 403,
      code: CLI_ERROR_CODES.ADMIN_ONLY as CliErrorCode,
    }
  }
  return { supabase, user, error: null, status: 200, code: null }
}
