'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { Memo } from '@/types/memo';
import { cookies } from 'next/headers';

export async function searchMemosForMention(query: string): Promise<Memo[]> {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const adminCode = cookieStore.get('memo_access_code')?.value || '';

    // 使用现有的 search_memos_secure RPC，或者一个更轻量的搜索
    const { data, error } = await (supabase.rpc as any)('search_memos_secure', {
        query_text: query,
        input_code: adminCode,
        limit_val: 5, // 只返回前 5 条建议
        offset_val: 0,
        filters: {}
    });

    if (error) {
        console.error('Error searching for mentions:', error);
        return [];
    }

    return (data || []) as Memo[];
}
