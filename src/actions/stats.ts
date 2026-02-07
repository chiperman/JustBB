'use server';

import { supabase } from '@/lib/supabase';
import { subDays } from 'date-fns';

export async function getMemoStats() {
    // 1. 获取全量基础统计数据 (为了统计总数和标签)
    // 考虑到数据量，我们只查询关键字段
    const { data: allData, error: allDataError } = await (supabase.from('memos') as any)
        .select('created_at, tags')
        .eq('is_private', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

    if (allDataError) {
        console.error('Error fetching comprehensive stats:', allDataError);
        return {
            totalMemos: 0,
            totalTags: 0,
            firstMemoDate: null,
            days: {}
        };
    }

    const stats: Record<string, number> = {};
    const uniqueTags = new Set<string>();

    (allData as { created_at: string; tags: string[] | null }[])?.forEach((item) => {
        // 聚合日期 - 使用本地时区 (Asia/Shanghai, UTC+8)
        const utcDate = new Date(item.created_at);
        const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
        const date = localDate.toISOString().split('T')[0];
        stats[date] = (stats[date] || 0) + 1;

        // 统计唯一标签
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => uniqueTags.add(tag));
        }
    });

    const totalMemos = allData?.length || 0;
    const totalTags = uniqueTags.size;
    const firstMemoDate = allData && allData.length > 0 ? allData[0].created_at : null;

    return {
        totalMemos,
        totalTags,
        firstMemoDate,
        days: stats
    };
}
