'use server';

import { getClient, getAdminClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Provider } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { ActionResponse } from '@/actions/shared/types';
import { loginSchema, signupSchema, verifyOtpSchema } from './schemas';

export async function login(formData: FormData): Promise<ActionResponse> {
    const rawData = Object.fromEntries(formData.entries());
    const validation = loginSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { email, password } = validation.data;
    const supabase = await getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('[Auth] Login failed:', error.message);
        return { success: false, error: '邮箱或密码错误' };
    }

    if (!data.user) {
        return { success: false, error: '登录失败' };
    }

    revalidatePath('/', 'layout');
    return { success: true, error: null };
}

export async function signup(formData: FormData): Promise<ActionResponse> {
    const rawData = Object.fromEntries(formData.entries());
    const validation = signupSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { email, password } = validation.data;
    const supabase = await getClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('[Auth] Signup failed:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

export async function verifyOtp(email: string, code: string): Promise<ActionResponse> {
    const validation = verifyOtpSchema.safeParse({ email, code });
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const supabase = await getClient();
    const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
    });

    if (error) {
        console.error('[Auth] OTP Verification failed:', error.message);
        return { success: false, error: '验证码错误或已过期' };
    }

    revalidatePath('/', 'layout');
    return { success: true, error: null };
}

export async function checkUserExists(email: string): Promise<ActionResponse<{ exists: boolean }>> {
    if (!email) return { success: false, error: '邮箱不能为空' };
    
    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (error) {
        console.error('[Auth] User existence check failed:', error.message);
        return { success: false, error: '系统繁忙，请稍后再试' };
    }

    const user = data.users.find(u => u.email === email);
    return { success: true, error: null, data: { exists: !!user } };
}

export async function signInWithOAuth(provider: Provider): Promise<ActionResponse> {
    const supabase = await getClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
    });

    if (error) {
        console.error('[Auth] OAuth failed:', error.message);
        return { success: false, error: '三方登录初始化失败' };
    }

    if (data.url) redirect(data.url);
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

    if (error || !user) return null;

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

export async function sendPasswordResetEmail(email: string): Promise<ActionResponse> {
    const supabase = await getClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
        console.error('[Auth] Reset email failed:', error.message);
        return { success: false, error: '发送重置邮件失败' };
    }

    return { success: true, error: null };
}

export async function updatePassword(password: string): Promise<ActionResponse> {
    if (!password || password.length < 6) {
        return { success: false, error: '新密码长度至少为 6 位' };
    }

    const supabase = await getClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        console.error('[Auth] Password update failed:', error.message);
        return { success: false, error: '修改密码失败' };
    }

    return { success: true, error: null };
}
