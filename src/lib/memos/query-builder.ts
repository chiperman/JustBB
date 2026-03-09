/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient } from '../supabase';

/**
 * 核心笔记字段选择字符串
 */
export const BASE_MEMO_SELECT = `
    id,
    memo_number,
    content,
    tags,
    is_private,
    is_pinned,
    access_code_hint,
    word_count,
    locations,
    created_at,
    updated_at,
    deleted_at
`;

/**
 * 获取笔记表查询对象（包装在对象中以避免 accidental execution）
 */
export async function getMemosQuery() {
    const supabase = await getClient();
    return { 
        query: supabase.from('memos').select(BASE_MEMO_SELECT) 
    };
}

/**
 * 常用查询过滤器
 */
export const MemoFilters = {
    /**
     * 正常显示的笔记（非回收站）
     */
    active: (query: any) => query.is('deleted_at', null),

    /**
     * 隐私过滤：非公开记录
     */
    publicOnly: (query: any) => query.eq('is_private', false),

    /**
     * 回收站记录
     */
    trashedOnly: (query: any) => query.not('deleted_at', 'is', null),

    /**
     * 按标签过滤
     */
    byTag: (query: any, tag: string) => query.contains('tags', [tag]),

    /**
     * 包含图片的内容
     */
    withImages: (query: any) => query.ilike('content', '%![%](%)%'),

    /**
     * 包含定位信息
     */
    withLocations: (query: any) => query.not('locations', 'eq', '[]').not('locations', 'is', null),

    /**
     * 日期范围过滤
     */
    dateRange: (query: any, start: string, end: string) => 
        query.gte('created_at', start).lte('created_at', end),

    /**
     * 分页器
     */
    paginate: (query: any, offset: number, limit: number) => 
        query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
};
