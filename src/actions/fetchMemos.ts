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
}) {
    const {
        query = '',
        adminCode = '',
        limit: limitSize = 20,
        offset: offsetVal = 0,
        tag = null,
        date = null,
        sort = 'newest'
    } = params;

    const supabase = await createClient();
    const filters: Record<string, unknown> = tag ? { tag } : {};
    if (date) {
        filters.date = date;
    }

    // 调用我们在 [DB-4] 中定义的 RPC 函数
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

export async function getArchivedMemos(year: number, month: number) {
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
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching archived memos:', error);
        return [];
    }

    return data as unknown as Memo[];
}

export async function getGalleryMemos() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('is_private', false)
        .is('deleted_at', null)
        .ilike('content', '%![%](%)%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching gallery memos:', error);
        return [];
    }

    return data as unknown as Memo[];
}
