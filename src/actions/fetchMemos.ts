'use server';

import { supabase } from '@/lib/supabase';

export async function getMemos(params: {
    query?: string;
    adminCode?: string;
    limit?: number;
    offset?: number;
    tag?: string;
}) {
    const { query = '', adminCode = '', limitSize = 20, offsetVal = 0, tag = null } = params as any;

    // 调用我们在 [DB-4] 中定义的 RPC 函数
    const { data, error } = await supabase.rpc('search_memos_secure', {
        query_text: query,
        input_code: adminCode, // 如果是管理员查看，这里传入口令
        limit_val: limitSize,
        offset_val: offsetVal,
        filters: tag ? { tag } : {},
    });

    if (error) {
        console.error('Error fetching memos via RPC:', error);
        return [];
    }

    return data;
}
