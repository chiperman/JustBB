'use server';

import { getSupabaseAdmin } from '@/lib/supabase';

export async function exportAllMemos() {
    const supabase = getSupabaseAdmin();
    // 获取包括已删除的所有数据，甚至可以按需过滤
    // 但作为备份功能，通常导出所有未删除的数据。
    // 如果也要导出垃圾箱数据，可以去掉 is deleted_at null 检查，或加个 flag。
    // 为了简单且符合直觉，"导出数据"通常指"当前有效数据"，垃圾箱算作"待回收"。
    // 这里我们先导出所有有效（未删除）数据。
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null)
        .order('id', { ascending: true }); // 按插入顺序(UUID其实无序，这里用id排序仅为了稳定)
    // 更好的应该是按 created_at
    // .order('created_at', { ascending: false });

    if (error) {
        console.error('Export failed:', error);
        return { error: 'Failed to fetch data' };
    }

    return { data };
}
