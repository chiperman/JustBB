'use server';

import { getClient } from '@/lib/supabase';
import { Json } from '@/types/database';
import { Memo, Location } from '@/types/memo';
import { cookies } from 'next/headers';
import { ActionResponse } from '../shared/types';
import { fetchMemosSchema, FetchMemosInput } from '@/lib/memos/schemas';

/**
 * 核心安全查询方法 (RPC 驱动)
 * 现在支持更严格的类型校验
 */
export async function getMemos(params: Partial<FetchMemosInput> = {}): Promise<ActionResponse<Memo[]>> {
    const validation = fetchMemosSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: '查询参数无效', data: [] };
    }

    const {
        query,
        adminCode,
        limit,
        offset,
        tag,
        num,
        date,
        year,
        month,
        sort,
        after_date,
        before_date,
        excludePinned,
    } = validation.data;

    const supabase = await getClient();
    const filters: Record<string, unknown> = {};

    if (tag) filters.tag = tag;
    if (num) filters.num = num;
    if (year) filters.year = year;
    if (month) filters.month = month;
    if (date && !before_date && !after_date) filters.date = date;
    if (after_date) filters.after_date = after_date;
    if (before_date) filters.before_date = before_date;
    if (excludePinned) filters.exclude_pinned = true;

    const { data, error } = await supabase.rpc("search_memos_secure", {
        query_text: query,
        input_code: adminCode,
        limit_val: limit,
        offset_val: offset,
        filters: filters as unknown as Json,
        sort_order: sort,
    });

    if (error) {
        console.error("Error fetching memos via RPC:", error);
        return { success: false, error: '查询失败', data: [] };
    }

    // 此时 data 已经是正确格式，由于 Memo 继承自数据库 Row，类型更安全
    return { success: true, error: null, data: (data as unknown as Memo[]) || [] };
}

/**
 * 为 Mention 搜索笔记 (带补丁逻辑)
 */
export async function searchMemosForMention(query: string, offset: number = 0, limit: number = 10): Promise<ActionResponse<Memo[]>> {
    const supabase = await getClient();
    const cookieStore = await cookies();
    const adminCode = cookieStore.get('memo_access_code')?.value || '';

    if (!query.trim()) {
        const { data, error } = await supabase
            .from('memos')
            .select('id, memo_number, created_at, content')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return { success: false, error: error.message, data: [] };
        return { success: true, error: null, data: (data || []) as unknown as Memo[] };
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('search_memos_secure', {
        query_text: query,
        input_code: adminCode,
        limit_val: limit,
        offset_val: offset,
        filters: {}
    });

    if (rpcError) return { success: false, error: rpcError.message, data: [] };

    let results = (rpcData || []) as unknown as Memo[];

    // 补丁：纯数字精确匹配
    if (offset === 0 && /^\d+$/.test(query)) {
        const { data: numMatches } = await supabase
            .from('memos')
            .select('id, memo_number, created_at, content, is_private')
            .eq('memo_number', parseInt(query))
            .is('deleted_at', null);

        if (numMatches?.[0] && !results.some(r => r.id === numMatches[0].id)) {
            results = [numMatches[0] as unknown as Memo, ...results];
        }
    }

    return { success: true, error: null, data: results };
}

/**
 * 获取笔记轻量索引
 */
export async function getMemoIndex(): Promise<ActionResponse<Partial<Memo>[]>> {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, created_at, content')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, error: null, data: (data || []) as unknown as Partial<Memo>[] };
}

/**
 * 获取画廊笔记 (带图片的)
 */
export async function getGalleryMemos(limit: number = 20, offset: number = 0): Promise<ActionResponse<Memo[]>> {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("memos")
        .select("*")
        .eq("is_private", false)
        .is("deleted_at", null)
        .ilike("content", "%![%](%)%")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, error: null, data: (data as unknown as Memo[]) || [] };
}

/**
 * 获取归档笔记 (按年月)
 */
export async function getArchivedMemos(year: number, month: number): Promise<ActionResponse<Memo[]>> {
    const supabase = await getClient();
    const startDate = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('is_private', false)
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching archived memos:', error);
        return { success: false, error: error.message, data: [] };
    }

    return { success: true, error: null, data: (data || []) as Memo[] };
}

/**
 * 根据编号获取笔记 (用于预览/引用)
 */
export async function getMemoByNumber(memoNumber: number): Promise<ActionResponse<Memo | null>> {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('memo_number', memoNumber)
        .eq('is_private', false)
        .is('deleted_at', null)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return { success: true, error: null, data: null };
        return { success: false, error: error.message, data: null };
    }
    return { success: true, error: null, data: data as Memo };
}

/**
 * 获取反向引用 (Backlinks)
 */
export async function getBacklinks(memoNumber: number): Promise<ActionResponse<Memo[]>> {
    if (!memoNumber) return { success: true, error: null, data: [] };

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, content, created_at')
        .eq('is_private', false)
        .is('deleted_at', null)
        .ilike('content', `%@${memoNumber}%`)
        .order('created_at', { ascending: false });

    if (error || !data) return { success: false, error: error?.message || '未知错误', data: [] };

    // 过滤逻辑保持，由于类型继承，m.content 类型已自动正确推断
    const filteredMemos = (data as unknown as Memo[]).filter(m => {
        const regex = new RegExp(`@${memoNumber}(?!\\d)`);
        return regex.test(m.content || '');
    });

    return { success: true, error: null, data: filteredMemos };
}

/**
 * 获取所有包含定位信息的笔记 (用于地图)
 */
export async function getMemosWithLocations(): Promise<ActionResponse<(Memo & { locations: Location[] })[]>> {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null)
        .not('locations', 'eq', '[]')
        .not('locations', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching memos with locations:', error);
        return { success: false, error: '获取定位数据失败', data: [] };
    }

    const memosWithLocations = (data || [])
        .filter(memo => Array.isArray(memo.locations) && memo.locations.length > 0)
        .map((memo) => ({
            ...memo,
            locations: memo.locations as unknown as Location[],
        })) as (Memo & { locations: Location[] })[];

    return { success: true, error: null, data: memosWithLocations };
}

/**
 * "那年今日" 回溯年数
 */
const ON_THIS_DAY_LOOKBACK_YEARS = 5;

/**
 * 获取“那年今日”笔记
 */
export async function getOnThisDayMemos(): Promise<ActionResponse<Memo[]>> {
    const supabase = await getClient();
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const currentYear = today.getFullYear();

    const startDate = new Date(currentYear - ON_THIS_DAY_LOOKBACK_YEARS, month - 1, day, 0, 0, 0).toISOString();
    const endDate = new Date(currentYear - 1, month - 1, day, 23, 59, 59).toISOString();

    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('is_private', false)
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

    if (error || !data) return { success: false, error: error?.message || '查询失败', data: [] };

    const filteredMemos = (data as unknown as Memo[]).filter(memo => {
        const d = new Date(memo.created_at);
        return d.getMonth() + 1 === month && d.getDate() === day;
    });

    return { success: true, error: null, data: filteredMemos };
}
