'use server';

import { getClient, getAdminClient } from '@/lib/supabase';
import { TimelineStats, HeatmapStats } from '@/types/stats';
import { env } from '@/lib/env';
import { isAdmin } from '../auth';
import { formatDate } from '@/lib/utils';
import { Memo } from '@/types/memo';
import { ActionResponse } from '../shared/types';

// ─── Supabase Free Plan 限制常量 ───────────────────────────
const SUPABASE_FREE_LIMITS = {
    DB_BYTES: 500 * 1024 * 1024,         // 500 MB
    STORAGE_BYTES: 1024 * 1024 * 1024,   // 1 GB
    MAU: 50_000,
    EGRESS_BYTES: 5 * 1024 * 1024 * 1024, // 5 GB
} as const;

// ─── 单位换算工具 ──────────────────────────────────────────
const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024));
const bytesToGB = (bytes: number) => Number((bytes / (1024 * 1024 * 1024)).toFixed(2));
const calcPercentage = (used: number, limit: number) => Math.min(Math.round((used / limit) * 100), 100);

/**
 * 获取笔记热力图统计
 */
export async function getMemoStats(): Promise<ActionResponse<HeatmapStats>> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_memo_stats_v2');

    if (error) {
        console.error('Error fetching heatmap stats:', error);
        return { success: false, error: '获取热力图数据失败', data: { totalMemos: 0, totalTags: 0, firstMemoDate: null, days: {} } };
    }

    return { success: true, error: null, data: (data as unknown as HeatmapStats) || { totalMemos: 0, totalTags: 0, firstMemoDate: null, days: {} } };
}

/**
 * 获取时间轴统计
 */
export async function getTimelineStats(): Promise<ActionResponse<TimelineStats>> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_timeline_stats');

    if (error) {
        console.error('Error fetching timeline stats:', error);
        return { success: false, error: '获取时间轴统计失败', data: { days: {} } };
    }

    return { success: true, error: null, data: (data as unknown as TimelineStats) || { days: {} } };
}

/**
 * 获取标签云统计
 */
export async function getAllTags(): Promise<ActionResponse<{ tag_name: string; count: number }[]>> {
    const supabase = await getClient();
    const { data, error } = await supabase.rpc('get_distinct_tags');

    if (error) {
        console.error('Error fetching tags:', error);
        return { success: false, error: '获取标签失败', data: [] };
    }

    return { success: true, error: null, data: data as { tag_name: string; count: number }[] };
}

// ─── Usage Stats: Management API 主路径 ────────────────────
async function fetchUsageViaManagementAPI(projectRef: string, apiKey: string) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/usage`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 0 },
    });

    if (!response.ok) return null;

    const usage = await response.json();
    const dbUsed = usage.db_size?.usage || 0;
    const storageUsed = usage.storage_size?.usage || 0;
    const mauUsed = usage.monthly_active_users?.usage || 0;
    const egressUsed = (usage.db_egress?.usage || 0) + (usage.storage_egress?.usage || 0);

    return {
        db: { used: bytesToMB(dbUsed), limit: 500, percentage: calcPercentage(dbUsed, SUPABASE_FREE_LIMITS.DB_BYTES), unit: 'MB' },
        storage: { used: bytesToMB(storageUsed), limit: 1024, percentage: calcPercentage(storageUsed, SUPABASE_FREE_LIMITS.STORAGE_BYTES), unit: 'MB' },
        mau: { used: mauUsed, limit: 50_000, percentage: calcPercentage(mauUsed, SUPABASE_FREE_LIMITS.MAU) },
        egress: { used: bytesToGB(egressUsed), limit: 5, percentage: calcPercentage(egressUsed, SUPABASE_FREE_LIMITS.EGRESS_BYTES), unit: 'GB' },
        realtime: { connections: usage.realtime_peak_connections?.usage || 0, messages: usage.realtime_message_count?.usage || 0 },
        functions: { invocations: usage.func_invocations?.usage || 0 },
    };
}

// ─── Usage Stats: SQL Fallback 备路径 ──────────────────────
async function fetchUsageViaSQLFallback() {
    const admin = getAdminClient();

    // admin client 的类型不覆盖 auth schema，此处需要类型断言
    const adminAny = admin as unknown as {
        from: (table: string) => { select: (columns: string, options: { count: string; head: boolean }) => Promise<{ count: number | null }> };
        rpc: (fn: string) => Promise<{ data: unknown }>;
    };

    const [{ count: userCount }, { data: dbBytesData }] = await Promise.all([
        adminAny.from('auth.users').select('*', { count: 'exact', head: true }),
        adminAny.rpc('get_database_size'),
    ]);

    const dbBytes = Number(dbBytesData) || 0;
    return {
        db: { used: bytesToMB(dbBytes), limit: 500, percentage: calcPercentage(dbBytes, SUPABASE_FREE_LIMITS.DB_BYTES), unit: 'MB' },
        mau: { used: userCount || 0, limit: 50_000, percentage: calcPercentage(userCount || 0, SUPABASE_FREE_LIMITS.MAU) },
        storage: { used: 0, limit: 1024, percentage: 0, unit: 'MB' },
        egress: { used: 0, limit: 5, percentage: 0, unit: 'GB' },
        realtime: { connections: 0, messages: 0 },
        functions: { invocations: 0 },
    };
}

/**
 * 获取 Supabase 使用情况 (Management API + SQL Fallback)
 */
export async function getSupabaseUsageStats() {
    const projectRef = env.SUPABASE_PROJECT_REF;
    const managementApiKey = env.SUPABASE_MANAGEMENT_API_KEY;

    // 优先使用 Management API
    if (projectRef && managementApiKey) {
        try {
            const data = await fetchUsageViaManagementAPI(projectRef, managementApiKey);
            if (data) return { success: true, isFullIndicator: true, data };
        } catch (e) {
            console.error('Management API error:', e);
        }
    }

    // 降级到 SQL 查询
    try {
        const data = await fetchUsageViaSQLFallback();
        return { success: true, isFullIndicator: false, data };
    } catch {
        return { success: false, error: 'Failed to fetch usage stats' };
    }
}

/**
 * 导出所有笔记
 */
export async function exportAllMemos(): Promise<ActionResponse<Memo[]>> {
    if (!await isAdmin()) return { success: false, error: '权限不足', data: [] };

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Export error:', error);
        return { success: false, error: error.message, data: [] };
    }

    return { success: true, error: null, data: data as Memo[] };
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
