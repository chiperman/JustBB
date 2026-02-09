'use server';

import { supabase } from '@/lib/supabase';

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
        filters: filters as Record<string, unknown>,
        sort_order: sort
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (error) {
        console.error('Error fetching memos via RPC:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return [];
    }

    return data;
}

export async function getArchivedMemos(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    // new Date(year, month, 0) returns the last day of the specific month
    // Note: month param in Date constructor is 0-indexed (0-11), 
    // but the day 0 goes to previous month's last day.
    // So if month is 10 (Oct), we want end of Oct.
    // new Date(2025, 10, 0) -> Oct 31, 2025
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

    return data;
}

export async function getGalleryMemos() {
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

    return data;
}
