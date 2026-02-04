'use server';

import { supabase } from '@/lib/supabase';

export async function getMemoByNumber(memoNumber: number) {
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
    return data;
}
