'use server';

import { createClient } from '@/utils/supabase/server';
import { Memo } from '@/types/memo';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function searchMemosForMention(query: string, offset: number = 0, limit: number = 10): Promise<Memo[]> {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const adminCode = cookieStore.get('memo_access_code')?.value || '';

    if (!query.trim()) {
        // 空查询：直接返回最新记录用于初始展示
        const { data, error } = await supabase
            .from('memos')
            .select('id, memo_number, created_at, content')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching latest memos for mention:', error);
            return [];
        }
        return (data || []) as unknown as Memo[];
    }

    // 有关键词：使用 RPC 进行安全搜索
    const { data: rpcData, error } = await supabase.rpc('search_memos_secure', {
        query_text: query,
        input_code: adminCode,
        limit_val: limit,
        offset_val: offset,
        filters: {}
    });

    if (error) {
        console.error('Error searching for mentions:', error);
        return [];
    }

    let results = (rpcData || []) as unknown as Memo[];

    // 额外补丁：如果是纯数字查询且是第一页，尝试匹配编号
    // RPC 搜索（pgroonga 或 websearch）可能权重计算导致编号匹配项排在后面或被过滤
    if (offset === 0 && /^\d+$/.test(query)) {
        const { data: numMatches } = await supabase
            .from('memos')
            .select('id, memo_number, created_at, content, is_private')
            .eq('memo_number', parseInt(query))
            .is('deleted_at', null);

        if (numMatches && numMatches.length > 0) {
            const numMatch = numMatches[0];
            const alreadyInResults = results.some(r => r.id === numMatch.id);
            if (!alreadyInResults) {
                // 将编号精确匹配项强行插入到结果首位
                results = [numMatch as unknown as Memo, ...results];
            }
        }
    }

    return results;
}


/**
 * 获取所有 Memo 的轻量索引，仅包含 id, memo_number 和 created_at。
 * 用于 @ 引用补全的初步筛选，避免拉取全量 content。
 */
export async function getMemoIndex(): Promise<{ id: string; memo_number: number; created_at: string; content: string }[]> {
    const supabase = await createClient();

    // 仅拉取必要的索引字段
    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, created_at, content')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching memo index:', error);
        return [];
    }

    return (data || []) as { id: string; memo_number: number; created_at: string; content: string }[];
}
