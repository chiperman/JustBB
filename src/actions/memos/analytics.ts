'use server';
import { getClient } from '@/lib/supabase';
import { TimelineStats, HeatmapStats } from '@/types/stats';
import { getAdminClient } from '@/lib/supabase';
import { getCurrentUserId } from '@/features/auth/actions';
import { ActionResponse } from '../shared/types';

/**
 * 获取统计数据 (V2 - RPC 驱动)
 */
export async function getMemoStats(): Promise<ActionResponse<HeatmapStats>> {
    const viewerId = await getCurrentUserId();
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('memos')
        .select('created_at, word_count, tags, is_private, owner_id')
        .is('deleted_at', null);

    if (error || !data) {
        console.error('Error fetching memo stats:', error?.message, error);
        return {
            success: false,
            error: error?.message || '获取统计失败',
            data: {
                totalMemos: 0,
                totalTags: 0,
                firstMemoDate: null,
                days: {}
            }
        };
    }

    const accessible = data.filter(memo => !memo.is_private || memo.owner_id === viewerId);
    const tagSet = new Set<string>();
    const days = accessible.reduce<Record<string, { count: number; wordCount: number }>>((acc, memo) => {
        const day = new Date(memo.created_at).toISOString().split('T')[0];
        const current = acc[day] || { count: 0, wordCount: 0 };
        acc[day] = {
            count: current.count + 1,
            wordCount: current.wordCount + (memo.word_count || 0),
        };
        (memo.tags || []).forEach(tag => tagSet.add(tag));
        return acc;
    }, {});

    const firstMemoDate = accessible.length > 0
        ? accessible
            .map(memo => memo.created_at)
            .sort()[0]
            ?.split('T')[0] || null
        : null;

    return {
        success: true,
        error: null,
        data: {
            totalMemos: accessible.length,
            totalTags: tagSet.size,
            firstMemoDate,
            days,
        }
    };
}

/**
 * 获取所有标签及其计数
 */
export async function getAllTags(): Promise<ActionResponse<{ tag_name: string; count: number }[]>> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_distinct_tags');

    if (error) {
        console.error('Error fetching tags:', error.message, error);
        return { success: false, error: error.message, data: [] };
    }

    return { success: true, error: null, data: (data || []) as { tag_name: string; count: number }[] };
}

/**
 * 获取时间轴统计
 */
export async function getTimelineStats(): Promise<ActionResponse<TimelineStats>> {
    const viewerId = await getCurrentUserId();
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('memos')
        .select('created_at, word_count, is_private, owner_id')
        .is('deleted_at', null);

    if (error || !data) {
        console.error('Error fetching timeline stats:', error?.message, error);
        return { success: false, error: error?.message || '获取时间轴失败', data: { days: {} } };
    }

    const days = data.reduce<Record<string, { count: number; wordCount: number }>>((acc, memo) => {
        if (memo.is_private && memo.owner_id !== viewerId) {
            return acc;
        }

        const day = new Date(memo.created_at).toISOString().split('T')[0];
        const current = acc[day] || { count: 0, wordCount: 0 };
        acc[day] = {
            count: current.count + 1,
            wordCount: current.wordCount + (memo.word_count || 0),
        };
        return acc;
    }, {});

    return { success: true, error: null, data: { days } };
}

/**
 * 导出笔记数据 (Markdown 或 JSON)
 */
export async function exportMemos(format: 'markdown' | 'json' = 'markdown'): Promise<ActionResponse<string>> {
    const viewerId = await getCurrentUserId();

    if (!viewerId) {
        return { success: false, error: '权限不足', data: '' };
    }

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('content, created_at, tags')
        .is('deleted_at', null)
        .eq('owner_id', viewerId)
        .order('created_at', { ascending: false });

    if (error || !data) {
        return { success: false, error: '导出失败', data: '' };
    }

    if (format === 'json') {
        return { success: true, error: null, data: JSON.stringify(data, null, 2) };
    }

    const markdown = data.map(m => {
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

    return { success: true, error: null, data: markdown };
}
