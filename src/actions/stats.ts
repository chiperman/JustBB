'use server';

import { supabase } from '@/lib/supabase';
import { subDays, format } from 'date-fns';

export async function getMemoStats() {
    // 获取过去 366 天的数据（确保覆盖一年）
    const startDate = subDays(new Date(), 366).toISOString();

    const { data, error } = await supabase
        .from('memos')
        .select('created_at')
        .eq('is_private', false)
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching stats:', error);
        return {};
    }

    // 聚合数据: YYYY-MM-DD -> count
    const stats: Record<string, number> = {};

    data?.forEach((item) => {
        // created_at 是 ISO 字符串，截取前10位即为 YYYY-MM-DD
        // 注意：这里使用 UTC 日期，如果需要本地化可能需要调整，但热力图通常接受统一标准
        const date = item.created_at.split('T')[0];
        stats[date] = (stats[date] || 0) + 1;
    });

    return stats;
}
