'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// 创建服务端 Supabase 客户端（支持 cookies）
function getSupabaseServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    });
}

export async function login(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: '请输入邮箱和密码' };
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }

    if (data.session) {
        // 将 session 信息存入 cookie
        const cookieStore = await cookies();
        cookieStore.set('supabase-auth-token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 天
            path: '/',
        });
        cookieStore.set('supabase-refresh-token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 天
            path: '/',
        });
    }

    revalidatePath('/');
    return { success: true };
}

export async function logout(): Promise<{ success: boolean }> {
    const supabase = getSupabaseServerClient();

    await supabase.auth.signOut();

    // 清除 cookies
    const cookieStore = await cookies();
    cookieStore.delete('supabase-auth-token');
    cookieStore.delete('supabase-refresh-token');

    revalidatePath('/');
    return { success: true };
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('supabase-auth-token')?.value;

    if (!token) {
        return null;
    }

    const supabase = getSupabaseServerClient();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
    };
}
