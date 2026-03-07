'use server';

import { getClient, getAdminClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Provider } from '@supabase/supabase-js';
import { env } from '@/lib/env';

import { ActionResponse } from './shared/types';

export async function login(formData: FormData): Promise<ActionResponse> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: '请输入邮箱和密码' };
    }

    const supabase = await getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }

    // 允许所有人登录，只需确认为已验证用户
    if (!data.user) {
        return { success: false, error: '登录失败' };
    }

    revalidatePath('/', 'layout');
    return { success: true, error: null };
}

export async function signup(formData: FormData): Promise<ActionResponse> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: '请输入邮箱和密码' };
    }

    const supabase = await getClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                // 不再在此处设置权限相关的 role，仅保留基础信息
            },
        },
    });

    if (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

export async function verifyOtp(email: string, code: string): Promise<ActionResponse> {
    const supabase = await getClient();

    const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
    });

    if (error) {
        console.error('Verify OTP error:', error);
        return { success: false, error: error.message };
    }

    // Verification successful, session is established.
    // Ensure role is present if needed, but handled by metadata in signup.

    revalidatePath('/', 'layout');
    return { success: true, error: null };
}

export async function checkUserExists(email: string): Promise<ActionResponse<{ exists: boolean }>> {
    const supabase = getAdminClient();

    // Supabase Admin SDK 不提供 getUserByEmail，使用 listUsers 并扩大 perPage 避免默认 50 的上限
    // 对于用户量较大的场景(>1000)，应改为自定义 RPC 查询 auth.users
    const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (error) {
        console.error('Check user error:', error);
        return { success: false, error: error.message };
    }

    const user = data.users.find(u => u.email === email);
    return { success: true, error: null, data: { exists: !!user } };
}

export async function signInWithOAuth(provider: Provider): Promise<ActionResponse> {
    const supabase = await getClient();

    // 获取当前请求的域名
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
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

    return { success: true, error: null };
}

export async function logout(): Promise<ActionResponse> {
    const supabase = await getClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    return { success: true, error: null };
}

export async function getCurrentUser() {
    const supabase = await getClient();

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

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(email: string): Promise<ActionResponse> {
    const supabase = await getClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
        console.error('Reset password email error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

/**
 * 更新密码
 */
export async function updatePassword(password: string): Promise<ActionResponse> {
    const supabase = await getClient();

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        console.error('Update password error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

