'use server';

import { createClient } from '@/utils/supabase/server';

export async function getMemoStats() {
    const supabase = await createClient();
    // 调用我们在数据库中定义的新 RPC 函数 get_memo_stats_v2
    // 该函数直接在服务端完成聚合，返回精简的统计数据，极大提高加载速度
    const { data, error } = await supabase.rpc('get_memo_stats_v2');

    if (error) {
        console.error('Error fetching memo stats via RPC v2:', error);
        return {
            totalMemos: 0,
            totalTags: 0,
            firstMemoDate: null,
            days: {}
        };
    }

    return data;
}

interface TimelineStats {
    days: Record<string, { count: number }>;
}

export async function getTimelineStats(): Promise<TimelineStats> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_timeline_stats');

    if (error) {
        console.error('Error fetching timeline stats via RPC:', error);
        return {
            days: {}
        };
    }

    return (data as unknown as TimelineStats) || { days: {} };
}
