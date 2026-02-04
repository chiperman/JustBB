'use server';

import { supabase } from '@/lib/supabase';
import { subDays } from 'date-fns';

export async function getMemoStats() {
    const startDate = subDays(new Date(), 366).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('memos') as any)
        .select('created_at')
        .eq('is_private', false)
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching stats:', error);
        return {};
    }

    const stats: Record<string, number> = {};

    (data as { created_at: string }[] | null)?.forEach((item) => {
        const date = item.created_at.split('T')[0];
        stats[date] = (stats[date] || 0) + 1;
    });

    return stats;
}
