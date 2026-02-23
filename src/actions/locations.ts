'use server';

import { createClient } from '@/utils/supabase/server';
import { Memo, Location } from '@/types/memo';

/**
 * 获取所有包含定位信息的 Memo
 * 用于地图全页视图
 */
export async function getMemosWithLocations(): Promise<{
    success: boolean;
    data: (Memo & { locations: Location[] })[];
    error?: string;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null)
        .not('locations', 'eq', '[]')
        .not('locations', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching memos with locations:', error);
        return { success: false, data: [], error: '获取定位数据失败' };
    }

    // 过滤有效的 location 数据
    const memosWithLocations = (data as any[])
        .filter(memo => {
            const locs = memo.locations;
            return Array.isArray(locs) && locs.length > 0;
        })
        .map(memo => ({
            ...memo,
            locations: memo.locations as unknown as Location[],
        })) as (Memo & { locations: Location[] })[];

    return { success: true, data: memosWithLocations };
}
