import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"
import { env } from "@/lib/env"

/**
 * 创建 CLI API 使用的 Supabase 客户端。
 * 未携带 Authorization 时保持匿名访问，携带时让 Supabase/RPC 识别用户身份。
 */
export function getCliClient(request: Request) {
  const authorization = request.headers.get("authorization")

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

export function getCliAuthClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
