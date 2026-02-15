'use server';

import { createClient } from '@/utils/supabase/server';
import { Memo } from '@/types/memo';

export async function getBacklinks(memoNumber: number): Promise<Memo[]> {
    if (!memoNumber) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, content, created_at')
        .eq('is_private', false)
        .is('deleted_at', null)
        .ilike('content', `%@${memoNumber}%`)
        .order('created_at', { ascending: false });

    if (error || !data) {
        console.error('Error fetching backlinks:', error);
        return [];
    }

    return (data as Memo[]).filter(m => {
        const regex = new RegExp(`@${memoNumber}(?!\\d)`);
        return regex.test(m.content);
    });
}
