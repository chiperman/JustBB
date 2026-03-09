import { getClient } from '@/lib/supabase';
import { TimelineStats, HeatmapStats } from '@/types/stats';
import { isAdmin } from '@/features/auth/actions';
import { ActionResponse } from '../shared/types';

/**
 * 获取统计数据 (V2 - RPC 驱动)
 */
export async function getMemoStats(): Promise<ActionResponse<HeatmapStats>> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_memo_stats_v2');

    if (error) {
        console.error('Error fetching memo stats:', error);
        return { 
            success: false, 
            error: error.message,
            data: { 
                totalMemos: 0, 
                totalTags: 0, 
                firstMemoDate: null, 
                days: {} 
            } 
        };
    }

    return { success: true, error: null, data: data as unknown as HeatmapStats };
}

// Alias for legacy usage
export const getSupabaseUsageStats = getMemoStats;

/**
 * 获取所有标签及其计数
 */
export async function getAllTags(): Promise<ActionResponse<{ tag_name: string; count: number }[]>> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_distinct_tags');

    if (error) {
        console.error('Error fetching tags:', error);
        return { success: false, error: error.message, data: [] };
    }

    return { success: true, error: null, data: (data || []) as { tag_name: string; count: number }[] };
}

/**
 * 获取时间轴统计
 */
export async function getTimelineStats(): Promise<ActionResponse<TimelineStats>> {
    const supabase = await getClient();
    const isUserAdmin = await isAdmin();
    
    const { data, error } = await supabase.rpc('get_timeline_stats', {
        include_private: isUserAdmin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (error) {
        console.error('Error fetching timeline stats:', error);
        return { success: false, error: error.message, data: { days: {} } };
    }

    return { success: true, error: null, data: data as unknown as TimelineStats };
}

/**
 * 导出笔记数据 (Markdown 或 JSON)
 */
export async function exportMemos(format: 'markdown' | 'json' = 'markdown'): Promise<string> {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('content, created_at, tags')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error || !data) return "";

    if (format === 'json') {
        return JSON.stringify(data, null, 2);
    }

    return data.map(m => {
        // hydration-safe: 此函数仅在 Server Action 中执行，不参与渲染
        // eslint-disable-next-line no-restricted-syntax
        const date = new Date(m.created_at).toLocaleString();
        return `---
Date: ${date}
Tags: ${m.tags?.join(', ') || ''}
---

${m.content}

`;
    }).join('\n\n');
}
