'use server';

import { createClient } from '@/utils/supabase/server';
import { Memo } from '@/types/memo';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function searchMemosForMention(query: string, offset: number = 0, limit: number = 10): Promise<Memo[]> {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const adminCode = cookieStore.get('memo_access_code')?.value || '';

    // 使用现有的 search_memos_secure RPC，或者一个更轻量的搜索
    // 使用现有的 search_memos_secure RPC，或者一个更轻量的搜索
    const { data, error } = await supabase.rpc('search_memos_secure', {
        query_text: query,
        input_code: adminCode,
        limit_val: limit,
        offset_val: offset,
        filters: {}
    });

    if (error) {
        console.error('Error searching for mentions:', error);
        return [];
    }

    return (data || []) as Memo[];
}

export async function getAllMemos(): Promise<Memo[]> {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const adminCode = cookieStore.get('memo_access_code')?.value || '';

    // 获取当前登录用户状态
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.app_metadata?.role === 'admin';

    // Fetch all memos, ordered by creation date descending
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null) // Only active (not deleted) memos
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all memos:', error);
        return [];
    }

    const memos = (data || []) as Memo[];

    // 如果是管理员，返回全量原始记录
    if (isAdmin) {
        return memos.map(m => ({ ...m, is_locked: false }));
    }

    // 对普通访客或持码用户进行脱敏处理
    return memos.map(m => {
        if (!m.is_private) {
            return { ...m, is_locked: false };
        }

        // 校验口令
        let isAuthorized = false;
        if (adminCode && m.access_code) {
            try {
                isAuthorized = bcrypt.compareSync(adminCode, m.access_code);
            } catch (e) {
                // Ignore hash format errors
            }
        }

        if (isAuthorized) {
            return { ...m, is_locked: false };
        }

        // 脱敏：隐藏内容、标签和敏感字段
        return {
            ...m,
            content: '',
            tags: [],
            is_locked: true,
            access_code: undefined // 绝对不要泄露加密后的 Hash
        };
    });
}
