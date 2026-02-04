'use server';

import { supabase } from '@/lib/supabase';

export async function getBacklinks(memoNumber: number) {
    if (!memoNumber) return [];

    // Search for content containing "@number"
    // Note: detailed regex search is harder in simple SQL content like, 
    // but '%@Number %' or '%@Number\n%' etc is tricky.
    // '%@Number%' is a reasonable approximation for now.
    // Ideally use full text search or regex match if supported.
    // Supabase supports regex via ~ operator usually? No, rpc is safer or simple like.
    // We'll use ilike '%@number%' which might match '@1234' when looking for '@123'.
    // To be safer, we can fetch candidates and filter in JS if needed, or use regex in Postgres if we use direct query.
    // .or(`content.ilike.%@${memoNumber} %,content.ilike.%@${memoNumber}\n%,...`)
    // Let's stick to simple like for MVP.

    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, created_at')
        .eq('is_private', false)
        .is('deleted_at', null)
        .ilike('content', `%@${memoNumber}%`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching backlinks:', error);
        return [];
    }

    // Filter strictly to avoid @123 matching @1234
    // Regex: /@123(?!\d)/
    const exactMatch = data.filter(m => {
        const regex = new RegExp(`@${memoNumber}(?!\\d)`);
        return regex.test(JSON.stringify(m) || ''); // Actually check content? We didn't select content.
    });

    // Wait, I need content to verify.
    // Fetching content might be heavy. 
    // Let's assume the loose match is acceptable for P2 "Refer back to this memo".
    // Or fetch content.

    // Improved query:
    const { data: dataWithContent, error: error2 } = await supabase
        .from('memos')
        .select('id, memo_number, content, created_at') // fetch content for verification
        .eq('is_private', false)
        .is('deleted_at', null)
        .ilike('content', `%@${memoNumber}%`)
        .order('created_at', { ascending: false });

    if (error2) return [];

    return dataWithContent.filter(m => {
        const regex = new RegExp(`@${memoNumber}(?!\\d)`);
        return regex.test(m.content);
    });
}
