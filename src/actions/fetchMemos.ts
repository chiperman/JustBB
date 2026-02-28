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
 * 获取指定单日的日记内容，并探测存在日记的上一个/下一个日期 (相邻游标)
 * 用于驱动全新的 Calendar Pager 翻页模式
 */
export async function getSingleDayMemosWithNeighbors(params: {
    targetDate: string; // YYYY-MM-DD
    adminCode?: string;
    tag?: string;
    query?: string;
}) {
    const { targetDate, adminCode = '', tag, query } = params;

    const endOfDayTarget = `${targetDate}T23:59:59.999Z`;
    const startOfDayTarget = `${targetDate}T00:00:00.000Z`;

    // 1. 获取当天的所有数据 (不受 limit 限制以展示全天内容)
    const dayMemos = await getMemos({
        query, adminCode, tag,
        limit: 100, // 假设单日一般不超过100条
        date: targetDate,
        sort: 'newest'
    });

    const supabase = await createClient();

    // 鉴权安全上下文 (探测邻居时也必须尊从权限，否则用户看到"下一天"按钮但点过去没权限)
    const canViewPrivate = adminCode === process.env.ADMIN_CODE;

    // 2. 探测上一天 (存在更老的日记)
    // 条件：创建时间 < startOfDayTarget
    let prevQuery = supabase
        .from('memos')
        .select('created_at')
        .is('deleted_at', null)
        .lt('created_at', startOfDayTarget)
        .order('created_at', { ascending: false })
        .limit(1);

    if (!canViewPrivate) {
        prevQuery = prevQuery.eq('is_private', false);
    }
    if (tag) {
        prevQuery = prevQuery.contains('tags', [tag]);
    }

    // 3. 探测下一天 (存在较新的日记)
    // 条件：创建时间 > endOfDayTarget
    let nextQuery = supabase
        .from('memos')
        .select('created_at')
        .is('deleted_at', null)
        .gt('created_at', endOfDayTarget)
        .order('created_at', { ascending: true })
        .limit(1);

    if (!canViewPrivate) {
        nextQuery = nextQuery.eq('is_private', false);
    }
    if (tag) {
        nextQuery = nextQuery.contains('tags', [tag]);
    }

    // 并发执行探测
    const [prevRes, nextRes] = await Promise.all([prevQuery, nextQuery]);

    // 提取日期 (YYYY-MM-DD)
    const formatToDateStr = (timestamp?: string) => {
        if (!timestamp) return null;
        return timestamp.split('T')[0];
    };

    const prevDate = prevRes.data && prevRes.data.length > 0 ? formatToDateStr(prevRes.data[0].created_at) : null;
    const nextDate = nextRes.data && nextRes.data.length > 0 ? formatToDateStr(nextRes.data[0].created_at) : null;

    return {
        memos: dayMemos,
        prevDate,
        nextDate
    };
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
