import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { env } from './env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 客户端使用的匿名实例 (浏览器环境专用)
 */
export const supabase = typeof window !== 'undefined'
    ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    : null as unknown as ReturnType<typeof createBrowserClient<Database>>;

/**
 * 服务端使用的匿名实例 (Server Components/Actions)
 */
export async function getClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // ignore in Server Components
                    }
                },
            },
        }
    );
}

/**
 * 服务端使用的管理实例 (绕过 RLS)
 * 仅在具有管理员身份校验的 Server Actions/API 中使用
 */
export const getAdminClient = () => {
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

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
