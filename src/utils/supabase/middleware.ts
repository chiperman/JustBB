import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 刷新 Session (如果过期)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. 保护管理员路径 /admin (排除登录页)
    const isLoginPage = request.nextUrl.pathname === '/admin/login'
    const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

    if (isAdminPath && !isLoginPage && !isAuthCallback) {
        // 未登录 -> 跳转登录
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/login'
            return NextResponse.redirect(url)
        }

        // 已登录但非管理员 -> 跳转到无权访问页
        if (user.app_metadata.role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            return NextResponse.redirect(url)
        }
    }

    // 2. 如果已登录且是管理员，访问登录页则跳转主页
    if (user && isLoginPage && user.app_metadata.role === 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return supabaseResponse
}
