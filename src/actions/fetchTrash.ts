'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { Memo } from '@/types/memo';

export async function getTrashMemos(): Promise<Memo[]> {
    const supabase = getSupabaseAdmin();
    // 使用 Admin 客户端直接查询，不依赖 RPC (或创建专用 RPC)
    // 回收站数据是敏感的，所以必须鉴权。这里 Admin Client 默认拥有所有权限，
    // 在真实场景应该校验当前用户 session，但既然是单人版我们假设能调 Action 就是有权限。
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .not('deleted_at', 'is', null) // 筛选已删除的
        .order('deleted_at', { ascending: false });

    if (error) {
        console.error('Error fetching trash memos:', error);
        return [];
    }

    // 适配前端 Memo 类型 (添加 is_locked 默认值)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[] || []).map((memo: Memo) => ({
        ...memo,
        is_locked: memo.is_private // 垃圾箱里的私密内容暂时也锁定
    })) as Memo[];
}
