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

export async function getAllMemoIndices(): Promise<Partial<Memo>[]> {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const adminCode = cookieStore.get('memo_access_code')?.value || '';

    // Fetch all memos, ordered by creation date descending
    // Only select necessary fields for indexing to keep payload small
    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, content, created_at, is_private, access_code, is_archived')
        .eq('is_archived', false) // Only active memos
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching memo indices:', error);
        return [];
    }

    // Filter based on visibility permissions
    const memos = (data || []) as unknown as Memo[];
    const visibleMemos = memos.filter((memo) => {
        if (!memo.is_private) return true;
        if (adminCode && memo.access_code === adminCode) return true;
        return false;
    });

    // Return lightweight objects
    return visibleMemos.map(memo => ({
        id: memo.id,
        memo_number: memo.memo_number,
        content: memo.content.substring(0, 100), // Truncate content for index
        created_at: memo.created_at
    }));
}
