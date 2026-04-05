import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

// 注意：middleware 运行在 Edge Runtime，不能使用 lib/env.ts 中的完整 Zod 校验
// 但可以保持 process.env 直接访问，因为 middleware 阶段这些变量必定存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 保护管理员路径 /admin (排除 OAuth 回调)
    const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

    // 性能优化：检查是否存在 auth 相关的 cookie
    // 如果没有 cookie 且不是受保护路径，则无需刷新 session，避免冗余的网络往返
    const allCookies = request.cookies.getAll()
    const hasSessionCookie = allCookies.some(c => c.name.includes('auth-token') || c.name.startsWith('sb-'))

    if (!hasSessionCookie && !isAdminPath && !isAuthCallback) {
        return supabaseResponse
    }

    // 刷新 Session (如果过期) - 仅在有 cookie 或访问管理路径时执行
    const { data: { user } } = await supabase.auth.getUser()

    if (isAdminPath && !isAuthCallback) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        if (user.app_metadata.role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
