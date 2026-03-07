import { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-url', request.url)

    // 简化：利用 NextRequest 构造函数自动复制原始请求的所有属性并合并 headers
    return await updateSession(new NextRequest(request, {
        headers: requestHeaders,
    }))
}

export const config = {
    matcher: [
        /*
         * 匹配所有请求路径，除了:
         * - _next/static (静态文件)
         * - _next/image (图像优化文件)
         * - favicon.ico (浏览器图标)
         * - 公共图片 (public 文件夹下的所有内容)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
