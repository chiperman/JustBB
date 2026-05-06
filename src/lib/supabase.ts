import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"
import { env } from "./env"

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * 客户端使用的匿名实例 (浏览器环境专用)
 */
export const supabase =
  typeof window !== "undefined"
    ? (() => {
        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("Supabase 客户端初始化失败: 缺少环境变量")
          return null as unknown as ReturnType<
            typeof createBrowserClient<Database>
          >
        }
        return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
      })()
    : (null as unknown as ReturnType<typeof createBrowserClient<Database>>)

/**
 * 服务端使用的匿名实例 (Server Components/Actions)
 */
export async function getClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 服务端客户端初始化失败: 缺少环境变量")
  }

  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // ignore in Server Components
        }
      },
    },
  })
}

/**
 * 服务端使用的管理实例 (绕过 RLS)
 */
export const getAdminClient = () => {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase 管理客户端初始化失败: 缺少环境变量")
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL as string,
    env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
