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

    return (data || []) as unknown as Memo[];
}


/**
 * 获取所有 Memo 的轻量索引，仅包含 id, memo_number 和 created_at。
 * 用于 @ 引用补全的初步筛选，避免拉取全量 content。
 */
export async function getMemoIndex(): Promise<{ id: string; memo_number: number; created_at: string }[]> {
    const supabase = await createClient();

    // 仅拉取必要的索引字段
    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching memo index:', error);
        return [];
    }

    return (data || []) as { id: string; memo_number: number; created_at: string }[];
}
