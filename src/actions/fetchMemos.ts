'use server';

import { createClient } from '@/utils/supabase/server';
import { Json } from '@/types/database';
import { Memo } from '@/types/memo';

export async function getMemos(params: {
    query?: string;
    adminCode?: string;
    limit?: number;
    offset?: number;
    tag?: string;
    date?: string;
    sort?: string;
    after_date?: string;  // 游标：在此日期之后
    before_date?: string; // 游标：在此日期之前（含）
}) {
    const {
        query = '',
        adminCode = '',
        limit: limitSize = 20,
        offset: offsetVal = 0,
        tag = null,
        date = null,
        sort = 'newest',
        after_date = null,
        before_date = null
    } = params;

    const supabase = await createClient();
    const filters: Record<string, unknown> = tag ? { tag } : {};

    // 逻辑修正：如果存在游标（向上或向下滚动），则不应应用 calendar date 的强等过滤
    // 否则数据流会被限制在同一天内
    if (date && !before_date && !after_date) {
        filters.date = date;
    }

    if (after_date) filters.after_date = after_date;
    if (before_date) filters.before_date = before_date;

    const { data, error } = await supabase.rpc('search_memos_secure', {
        query_text: query,
        input_code: adminCode,
        limit_val: limitSize,
        offset_val: offsetVal,
        filters: filters as unknown as Json,
        sort_order: sort
    });

    if (error) {
        console.error('Error fetching memos via RPC:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return [];
    }

    return data as unknown as Memo[];
}

/**
 * 以目标日期为中心抓取上下文窗口
 * 返回目标日期前后的平衡数据（共 limit 条）
 */
export async function getMemosContext(params: {
    targetDate: string;
    limit?: number;
    adminCode?: string;
    tag?: string;
    query?: string;
}) {
    const { targetDate, limit = 20, adminCode, tag, query } = params;

    // 将日期字符串 (YYYY-MM-DD) 转换为当天最后一秒，确保包含选定当天的所有日记
    const endOfDayTarget = `${targetDate}T23:59:59.999Z`;

    // 仅向过去方向抓取 limit 条数据
    const olderMemos = await getMemos({
        query, adminCode, tag,
        limit,
        sort: 'newest',
        before_date: endOfDayTarget
    });

    return olderMemos;
}

export async function getArchivedMemos(year: number, month: number, limit: number = 20, offset: number = 0) {
    const supabase = await createClient();
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('is_private', false)
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching archived memos:', error);
        return [];
    }

    return data as unknown as Memo[];
}

export async function getGalleryMemos(limit: number = 20, offset: number = 0) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('is_private', false)
        .is('deleted_at', null)
        .ilike('content', '%![%](%)%')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching gallery memos:', error);
        return [];
    }

    return data as unknown as Memo[];
}
