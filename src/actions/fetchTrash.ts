'use server';

import { createClient } from '@/utils/supabase/server';
import { Memo } from '@/types/memo';
import { isAdmin } from './auth';

export async function getTrashMemos(): Promise<Memo[]> {
    // 权限校验
    if (!(await isAdmin())) {
        console.warn('Unauthorized attempt to fetch trash memos');
        return [];
    }

    const supabase = await createClient();
    // 使用 Admin 客户端直接查询，不依赖 RPC (或创建专用 RPC)
    // 回收站数据是敏感的，所以必须鉴权。
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
    return (data || []).map((memo) => ({
        ...memo,
        is_locked: memo.is_private // 垃圾箱里的私密内容暂时也锁定
    })) as Memo[];
}

