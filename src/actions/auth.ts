'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Provider } from '@supabase/supabase-js';

export async function login(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: '请输入邮箱和密码' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }

    // 检查管理员权限
    if (data.user?.app_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        return { success: false, error: '非管理员账户无法登录后台' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function signInWithOAuth(provider: Provider) {
    const supabase = await createClient();

    // 获取当前请求的域名
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
            // 提醒：第三方登录后，仍然需要在 callback 中检查 admin 权限，或者由系统管理员预先设置角色
        },
    });

    if (error) {
        console.error('OAuth error:', error);
        return { success: false, error: error.message };
    }

    if (data.url) {
        redirect(data.url);
    }

    return { success: true };
}

export async function logout(): Promise<{ success: boolean }> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function getCurrentUser() {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    // 只返回公开信息，并包含角色
    return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        role: user.app_metadata?.role as string | undefined,
    };
}

export async function isAdmin() {
    const user = await getCurrentUser();
    return user?.role === 'admin';
}
