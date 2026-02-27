import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 客户端使用的匿名实例 (兼容性导出)
 * 注意：在浏览器环境使用此实例。在服务端组件/Action中请优先使用 @/utils/supabase/server
 */
export const supabase = typeof window !== 'undefined'
    ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    : null as unknown as ReturnType<typeof createBrowserClient<Database>>; // 在服务端访问此常量会返回 null 或引起推断，强制使用 server 工具

/**
 * 服务端使用的管理实例 (绕过 RLS)
 * 仅在 Server Actions/API 中使用
 */
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 我们仍然使用 createServerClient 但传入 serviceRoleKey，
    // 这样它可以正确处理服务端环境，同时具备管理权限。
    // 注意：Admin 实例通常不需要同步 Cookie，因为它绕过了 RLS
    return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
        cookies: {
            getAll() { return [] },
            setAll() { },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
