'use server';

import { supabase } from '@/lib/supabase';

export async function getOnThisDayMemos() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Use RPC or raw query?
    // Supabase JS doesn't support complex extract queries easily without RCP or raw SQL via function.
    // However, we can fetch all memos and filter in JS if the total count is small (<10000).
    // Or we can try to guess ranges (today in 2024, today in 2023...).
    // For performance with many years, ranges is better.

    // Let's iterate last 5 years.
    const promises = [];
    for (let i = 1; i <= 5; i++) {
        const year = today.getFullYear() - i;
        const startDate = new Date(year, month - 1, day, 0, 0, 0).toISOString();
        const endDate = new Date(year, month - 1, day, 23, 59, 59).toISOString();

        promises.push(
            supabase
                .from('memos')
                .select('*')
                .eq('is_private', false)
                .is('deleted_at', null)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
        );
    }

    const results = await Promise.all(promises);
    const memos = results.flatMap(r => r.data || []);

    // Return sorted
    return memos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
