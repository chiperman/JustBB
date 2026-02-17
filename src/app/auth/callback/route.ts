import { NextResponse } from 'next/server'
// 使用我们定义的 server client
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // 如果提供了 "next" 参数，则在登录后跳转到那里
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // 严格权限校验：只有 admin 角色可以登录
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.app_metadata?.role !== 'admin') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/unauthorized`)
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // 在开发环境下，我们直接跳转到本地域名
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // 失败则跳转到登录页并带上错误提示
    return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}
