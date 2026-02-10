'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function deleteMemo(id: string) {
    const supabase = getSupabaseAdmin();
    // 软删除: 设置 deleted_at 为当前时间
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('memos') as any)
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
    const supabase = getSupabaseAdmin();
    // 恢复: 设置 deleted_at 为 NULL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('memos') as any)
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
    const supabase = getSupabaseAdmin();
    // 硬删除
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('memos') as any)
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
    const supabase = getSupabaseAdmin();
    // 永久删除所有已标记为删除的记录
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('memos') as any)
        .delete()
        .not('deleted_at', 'is', null);

    if (error) {
        console.error('Error emptying trash:', error);
        return { success: false, error: '清空回收站失败' };
    }

    revalidatePath('/trash');
    return { success: true };
}
