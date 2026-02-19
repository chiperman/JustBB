'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { isAdmin } from './auth';

export async function deleteMemo(id: string) {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    const supabase = await createClient();
    // 软删除: 设置 deleted_at 为当前时间
    const { error } = await supabase
        .from('memos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error soft deleting memo:', error);
        return { success: false, error: '删除失败' };
    }

    revalidatePath('/');
    return { success: true };
}

export async function restoreMemo(id: string) {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    const supabase = await createClient();
    // 恢复: 设置 deleted_at 为 NULL
    const { error } = await supabase
        .from('memos')
        .update({ deleted_at: null })
        .eq('id', id);

    if (error) {
        console.error('Error restoring memo:', error);
        return { success: false, error: '恢复失败' };
    }

    revalidatePath('/trash');
    revalidatePath('/');
    return { success: true };
}

export async function permanentDeleteMemo(id: string) {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    const supabase = await createClient();
    // 硬删除
    const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error permanently deleting memo:', error);
        return { success: false, error: '彻底删除失败' };
    }

    revalidatePath('/trash');
    return { success: true };
}

export async function emptyTrash() {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    const supabase = await createClient();
    // 永久删除所有已标记为删除的记录
    const { error } = await supabase
        .from('memos')
        .delete()
        .not('deleted_at', 'is', null);

    if (error) {
        console.error('Error emptying trash:', error);
        return { success: false, error: '清空回收站失败' };
    }

    revalidatePath('/trash');
    return { success: true };
}
export async function batchDeleteMemos(ids: string[]) {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    if (ids.length === 0) return { success: true };

    const supabase = await createClient();
    const { error } = await supabase
        .from('memos')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);

    if (error) {
        console.error('Error batch deleting memos:', error);
        return { success: false, error: '批量删除失败' };
    }

    revalidatePath('/');
    return { success: true };
}
