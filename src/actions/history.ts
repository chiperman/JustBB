'use server';

import { createClient } from '@/utils/supabase/server';
import { Memo } from '@/types/memo';

export async function getOnThisDayMemos(): Promise<Memo[]> {
    const supabase = await createClient();
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

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
    const memos = results.flatMap(r => (r.data as Memo[]) || []);

    return memos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
