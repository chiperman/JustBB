import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"
import { env } from "@/lib/env"

/**
 * 创建 CLI API 使用的 Supabase 客户端。
 * 未携带 Authorization 时保持匿名访问，携带时让 Supabase/RPC 识别用户身份。
 */
function createCliClient(authorization: string | null) {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: authorization ? { Authorization: authorization } : {},
    },
  })
}

export function getCliClient(request: Request) {
  return createCliClient(request.headers.get("authorization"))
}

/**
 * 公开读取只承认管理员 CLI 会话。遗留普通账号 token 一律按匿名访客处理，
 * 防止它改变 search_memos_secure 的可见性结果。
 */
export async function getCliReadClient(request: Request) {
  const authorization = request.headers.get("authorization")
  if (!authorization) return createCliClient(null)

  const authenticatedClient = createCliClient(authorization)
  const { data, error } = await authenticatedClient.auth.getUser()
  if (!error && data.user?.app_metadata?.role === "admin") return authenticatedClient

  return createCliClient(null)
}

export function getCliAuthClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
