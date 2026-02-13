'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { Memo } from '@/types/memo';
import { cookies } from 'next/headers';

export async function searchMemosForMention(query: string, offset: number = 0, limit: number = 10): Promise<Memo[]> {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const adminCode = cookieStore.get('memo_access_code')?.value || '';

    // 使用现有的 search_memos_secure RPC，或者一个更轻量的搜索
    const { data, error } = await (supabase.rpc as any)('search_memos_secure', {
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
    const supabase = getSupabaseAdmin();

    // Fetch all memos, ordered by creation date descending
    // Select all fields required for the UI
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null) // Only active (not deleted) memos
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all memos:', error);
        return [];
    }

    return (data || []) as Memo[];
}
