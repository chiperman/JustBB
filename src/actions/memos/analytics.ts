'use server';

import { getClient, getAdminClient } from '@/lib/supabase';
import { TimelineStats, HeatmapStats } from '@/types/stats';
import { env } from '@/lib/env';
import { ActionResponse } from '../shared/types';
import { isAdmin } from '../auth';
import { formatDate } from '@/lib/utils';
import { Memo } from '@/types/memo';

/**
 * 获取笔记热力图统计
 */
export async function getMemoStats(): Promise<HeatmapStats> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_memo_stats_v2');

    if (error) {
        console.error('Error fetching heatmap stats:', error);
        return { totalMemos: 0, totalTags: 0, firstMemoDate: null, days: {} };
    }

    return (data as unknown as HeatmapStats) || { totalMemos: 0, totalTags: 0, firstMemoDate: null, days: {} };
}

/**
 * 获取时间轴统计
 */
export async function getTimelineStats(): Promise<TimelineStats> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_timeline_stats');

    if (error) {
        console.error('Error fetching timeline stats:', error);
        return { days: {} };
    }

    return (data as unknown as TimelineStats) || { days: {} };
}

/**
 * 获取标签云统计
 */
export async function getAllTags() {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_distinct_tags');

    if (error) {
        console.error('Error fetching tags:', error);
        return [];
    }

    return data as { tag_name: string; count: number }[];
}

/**
 * 获取 Supabase 使用情况 (Management API + SQL Fallback)
 */
export async function getSupabaseUsageStats() {
    const projectRef = env.SUPABASE_PROJECT_REF;
    const managementApiKey = env.SUPABASE_MANAGEMENT_API_KEY;

    const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024));
    const bytesToGB = (bytes: number) => Number((bytes / (1024 * 1024 * 1024)).toFixed(2));
    const LIMITS = { DB: 500 * 1024 * 1024, STORAGE: 1024 * 1024 * 1024, MAU: 50000, EGRESS: 5 * 1024 * 1024 * 1024 };

    if (projectRef && managementApiKey) {
        try {
            const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/usage`, {
                headers: { Authorization: `Bearer ${managementApiKey}` },
                next: { revalidate: 0 }
            });

            if (response.ok) {
                const usage = await response.json();
                const dbUsed = usage.db_size?.usage || 0;
                const storageUsed = usage.storage_size?.usage || 0;
                const mauUsed = usage.monthly_active_users?.usage || 0;
                const egressUsed = (usage.db_egress?.usage || 0) + (usage.storage_egress?.usage || 0);

                return {
                    success: true,
                    isFullIndicator: true,
                    data: {
                        db: { used: bytesToMB(dbUsed), limit: 500, percentage: Math.min(Math.round((dbUsed / LIMITS.DB) * 100), 100), unit: 'MB' },
                        storage: { used: bytesToMB(storageUsed), limit: 1024, percentage: Math.min(Math.round((storageUsed / LIMITS.STORAGE) * 100), 100), unit: 'MB' },
                        mau: { used: mauUsed, limit: 50000, percentage: Math.min(Math.round((mauUsed / LIMITS.MAU) * 100), 100) },
                        egress: { used: bytesToGB(egressUsed), limit: 5, percentage: Math.min(Math.round((egressUsed / LIMITS.EGRESS) * 100), 100), unit: 'GB' },
                        realtime: { connections: usage.realtime_peak_connections?.usage || 0, messages: usage.realtime_message_count?.usage || 0 },
                        functions: { invocations: usage.func_invocations?.usage || 0 }
                    }
                };
            }
        } catch (e) {
            console.error('Management API error:', e);
        }
    }

    // Fallback to SQL
    try {
        const admin = getAdminClient();
         
        const [{ count: userCount }, { data: dbBytesData }] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (admin as any).from('auth.users').select('*', { count: 'exact', head: true }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (admin as any).rpc('get_database_size')
        ]);

        const dbBytes = Number(dbBytesData) || 0;
        return {
            success: true,
            isFullIndicator: false,
            data: {
                db: { used: bytesToMB(dbBytes), limit: 500, percentage: Math.min(Math.round((dbBytes / LIMITS.DB) * 100), 100), unit: 'MB' },
                mau: { used: userCount || 0, limit: 50000, percentage: Math.min(Math.round(((userCount || 0) / LIMITS.MAU) * 100), 100) },
                storage: { used: 0, limit: 1024, percentage: 0, unit: 'MB' },
                egress: { used: 0, limit: 5, percentage: 0, unit: 'GB' },
                realtime: { connections: 0, messages: 0 },
                functions: { invocations: 0 }
            }
        };
    } catch (e) {
        return { success: false, error: 'Failed to fetch usage stats' };
    }
}

/**
 * 导出所有笔记
 */
export async function exportAllMemos(): Promise<{ data: Memo[] | null; error: string | null }> {
    if (!await isAdmin()) return { data: null, error: '权限不足' };

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Export error:', error);
        return { data: null, error: error.message };
    }

    return { data: data as Memo[], error: null };
}

/**
 * 按格式导出笔记
 */
export async function exportMemos(format: 'json' | 'markdown'): Promise<string> {
    const { data, error } = await exportAllMemos();

    if (error || !data) {
        throw new Error('Failed to fetch memos');
    }

    if (format === 'json') {
        return JSON.stringify(data, null, 2);
    } else {
        return data.map(memo => {
            const date = formatDate(memo.created_at);
            return `---
id: ${memo.id}
date: ${date}
tags: ${memo.tags?.join(', ') || ''}
---

${memo.content}
`;
        }).join('\n\n');
    }
}
