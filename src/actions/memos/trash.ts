'use server';

import { revalidatePath } from 'next/cache';
import { getClient } from '@/lib/supabase';
import { ActionResponse } from '../shared/types';
import { isAdmin } from '../auth';
import { Memo } from '@/types/memo';

/**
 * 软删除笔记
 */
export async function deleteMemo(id: string): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const supabase = await getClient();
    const { error } = await supabase
        .from('memos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error soft deleting memo:', error);
        return { success: false, error: '删除失败' };
    }

    revalidatePath('/');
    return { success: true, error: null };
}

/**
 * 恢复笔记
 */
export async function restoreMemo(id: string): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const supabase = await getClient();
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
    return { success: true, error: null };
}

/**
 * 硬删除笔记
 */
export async function permanentDeleteMemo(id: string): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const supabase = await getClient();
    const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error permanently deleting memo:', error);
        return { success: false, error: '彻底删除失败' };
    }

    revalidatePath('/trash');
    return { success: true, error: null };
}

/**
 * 清空回收站
 */
export async function emptyTrash(): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const supabase = await getClient();
    const { error } = await supabase
        .from('memos')
        .delete()
        .not('deleted_at', 'is', null);

    if (error) {
        console.error('Error emptying trash:', error);
        return { success: false, error: '清空回收站失败' };
    }

    revalidatePath('/trash');
    return { success: true, error: null };
}

/**
 * 获取回收站内容
 */
export async function getTrashMemos(): Promise<ActionResponse<Memo[]>> {
    if (!(await isAdmin())) return { success: false, error: '权限不足', data: [] };

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

    if (error) {
        console.error('Error fetching trash memos:', error);
        return { success: false, error: '获取回收站数据失败', data: [] };
    }

    const memos = (data || []).map((memo) => ({
        ...memo,
        is_locked: memo.is_private
    })) as Memo[];

    return { success: true, error: null, data: memos };
}

/**
 * 批量操作：删除、恢复、永久删除
 */
export async function batchTrashAction(ids: string[], action: 'delete' | 'restore' | 'permanent'): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    if (ids.length === 0) return { success: true, error: null };

    const supabase = await getClient();
    let query;

    if (action === 'delete') {
        query = supabase.from('memos').update({ deleted_at: new Date().toISOString() }).in('id', ids);
    } else if (action === 'restore') {
        query = supabase.from('memos').update({ deleted_at: null }).in('id', ids);
    } else {
        query = supabase.from('memos').delete().in('id', ids);
    }

    const { error } = await query;
    if (error) {
        console.error(`Error in batch ${action}:`, error);
        return { success: false, error: '批量操作失败' };
    }

    revalidatePath('/');
    revalidatePath('/trash');
    return { success: true, error: null };
}

/**
 * 批量删除笔记（软删除）
 */
export async function batchDeleteMemos(ids: string[]): Promise<ActionResponse> {
    return batchTrashAction(ids, 'delete');
}

/**
 * 批量恢复笔记
 */
export async function batchRestoreMemos(ids: string[]): Promise<ActionResponse> {
    return batchTrashAction(ids, 'restore');
}

/**
 * 批量永久删除笔记
 */
export async function batchPermanentDeleteMemos(ids: string[]): Promise<ActionResponse> {
    return batchTrashAction(ids, 'permanent');
}
