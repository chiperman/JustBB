'use server';

import { cookies } from 'next/headers';

export async function unlockWithCode(code: string): Promise<{ success: boolean; error?: string }> {
    if (!code) return { success: false, error: '请输入口令' };

    const cookieStore = await cookies();

    // 我们假设此时校验的是“管理员口令”或者是全局口令
    // 根据 PRD，目前是单人/管理员版，口令通常存储在环境变量或特定配置中
    // 或者是针对具体 Memo 的校验。

    // 如果是全局管理员模式（对应目前 searchParams: code 的逻辑）:

    // 如果没有环境变量定义，我们暂时使用简单校验或针对具体记录的校验
    // 但 page.tsx 目前是将 code 传给 search_memos_secure。

    // 逻辑：将 code 存入 Cookie
    cookieStore.set('memo_access_code', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    return { success: true };
}

export async function clearUnlockCode() {
    const cookieStore = await cookies();
    cookieStore.delete('memo_access_code');
}
