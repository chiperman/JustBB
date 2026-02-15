'use server';

import { createClient } from '@/utils/supabase/server';
import { Memo } from '@/types/memo';

export async function getMemoByNumber(memoNumber: number): Promise<Memo | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('memos')
        .select('content')
        .eq('memo_number', memoNumber)
        .eq('is_private', false)
        .is('deleted_at', null)
        .single();

    if (error) {
        return null;
    }
    return data as Memo;
}
