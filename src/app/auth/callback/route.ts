import { NextResponse } from "next/server"
// 使用我们定义的 server client
import { getClient } from "@/lib/supabase"
import { env } from "@/lib/env"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // 如果提供了 "next" 参数，则在登录后跳转到那里
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await getClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 登录成功后跳转到安全的目标地址
      const target = buildSafeRedirectUrl(request, origin, next)
      return NextResponse.redirect(target)
    }
  }

  // 失败则跳转到登录页并带上错误提示
  return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}

/**
 * 构建安全的目标 URL，防止开放重定向攻击。
 *
 * x-forwarded-host 由客户端控制，必须校验是否匹配站点域名。
 * 开发环境直接使用 origin（Next.js dev server 固定 localhost）。
 */
function buildSafeRedirectUrl(
  request: Request,
  origin: string,
  next: string
): string {
  if (process.env.NODE_ENV === "development") {
    return `${origin}${next}`
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const allowedHost = env.NEXT_PUBLIC_SITE_URL?.replace(
    /^https?:\/\//,
    ""
  ).replace(/\/.+$/, "")

  if (forwardedHost && forwardedHost === allowedHost) {
    return `https://${forwardedHost}${next}`
  }

  return `${origin}${next}`
}
