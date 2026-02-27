'use server';

import { createClient } from '@/utils/supabase/server';
import { TimelineStats, HeatmapStats } from '@/types/stats';

export async function getMemoStats(): Promise<HeatmapStats> {
    const supabase = await createClient();
    // 调用我们在数据库中定义的新 RPC 函数 get_memo_stats_v2
    // 该函数直接在服务端完成聚合，返回精简的统计数据，极大提高加载速度
    const { data, error } = await supabase.rpc('get_memo_stats_v2');

    if (error) {
        console.error('Error fetching memo stats via RPC v2:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        return {
            totalMemos: 0,
            totalTags: 0,
            firstMemoDate: null,
            days: {}
        };
    }

    return (data as unknown as HeatmapStats) || {
        totalMemos: 0,
        totalTags: 0,
        firstMemoDate: null,
        days: {}
    };
}

export async function getTimelineStats(): Promise<TimelineStats> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_timeline_stats');

    if (error) {
        console.error('Error fetching timeline stats via RPC:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        return {
            days: {}
        };
    }

    return (data as unknown as TimelineStats) || { days: {} };
}
