import { getCliClient } from "./client"

export async function requireCliAdmin(request: Request) {
  const supabase = getCliClient(request)
  const { data, error } = await supabase.auth.getUser()
  const user = data.user

  if (error || !user) {
    return { supabase, user: null, error: "请先执行 justmemo login", status: 401 }
  }
  if (user.app_metadata?.role !== "admin") {
    return { supabase, user: null, error: "权限不足，仅管理员可操作", status: 403 }
  }
  return { supabase, user, error: null, status: 200 }
}
