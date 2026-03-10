'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getClient, getAdminClient } from '@/lib/supabase';
import { ActionResponse } from '../shared/types';
import { Memo } from '@/types/memo';
import { isAdmin } from '@/features/auth/actions';
import { buildMemoPayload } from './helpers';
import { calculateWordCount, extractLocations, mergeTagsIntoContent } from '@/lib/memos/parser';
import { Database } from '@/types/database';
import { createMemoSchema, updateMemoContentSchema, updateMemoStateSchema, batchAddTagsSchema } from '@/lib/memos/schemas';

type MemoInsert = Database['public']['Tables']['memos']['Insert'];

/**
 * 创建新笔记
 */
export async function createMemo(formData: FormData): Promise<ActionResponse<Memo>> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = createMemoSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { content, is_private, is_pinned, access_code, access_code_hint } = validation.data;
    const supabase = await getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
        content,
        is_private,
        is_pinned,
        word_count: calculateWordCount(content),
        locations: extractLocations(content),
    };

    if (is_private && access_code) {
        payload.access_code_hash = bcrypt.hashSync(access_code, 10);
        payload.access_code_hint = access_code_hint || null;
    }

    const { data, error } = await supabase
        .from('memos')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error('Error creating memo:', error);
        return { success: false, error: '发布失败' };
    }

    revalidatePath('/');
    return { success: true, error: null, data: data as Memo };
}

/**
 * 更新笔记内容 (含内容解析)
 */
export async function updateMemoContent(formData: FormData): Promise<ActionResponse<Memo>> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = updateMemoContentSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { id, content } = validation.data;
    const supabase = await getClient();

    const { data, error } = await supabase
        .from('memos')
        .update({
            content,
            word_count: calculateWordCount(content),
            locations: extractLocations(content) as unknown as MemoInsert['locations'],
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating memo content:', error);
        return { success: false, error: '保存失败' };
    }

    revalidatePath('/');
    return { success: true, error: null, data: data as Memo };
}

/**
 * 更新笔记状态 (置顶、私密等)
 */
export async function updateMemoState(formData: FormData): Promise<ActionResponse<Memo>> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = updateMemoStateSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { id, is_pinned, is_private, access_code, access_code_hint } = validation.data;
    const supabase = await getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};
    if (is_pinned !== undefined) updatePayload.is_pinned = is_pinned;
    
    if (is_private !== undefined) {
        updatePayload.is_private = is_private;
        if (is_private && access_code) {
            updatePayload.access_code_hash = bcrypt.hashSync(access_code, 10);
            updatePayload.access_code_hint = access_code_hint || null;
        } else if (!is_private) {
            updatePayload.access_code_hash = null;
            updatePayload.access_code_hint = null;
        }
    }

    const { data, error } = await supabase
        .from('memos')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating memo state:', error);
        return { success: false, error: '更新失败' };
    }

    revalidatePath('/');
    return { success: true, error: null, data: data as Memo };
}

/**
 * 批量为笔记添加标签
 */
export async function batchAddTagsToMemos(formData: FormData): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = batchAddTagsSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { ids, tags } = validation.data;
    const supabase = await getClient();

    const validIds = ids.filter(Boolean);
    const validTags = tags.map(t => t.trim()).filter(Boolean);

    if (validIds.length === 0 || validTags.length === 0) {
        return { success: true, error: null };
    }

    // 先拉取当前内容
    const { data: memos, error: fetchError } = await supabase
        .from('memos')
        .select('id, content, tags')
        .in('id', validIds);

    if (fetchError) return { success: false, error: '获取笔记失败' };

    const results = await Promise.all(memos.map(memo => {
        const { content: newContent, tags: combinedTags } = mergeTagsIntoContent(
            memo.content || '',
            memo.tags || [],
            validTags
        );

        return supabase
            .from('memos')
            .update({
                tags: combinedTags,
                content: newContent,
                updated_at: new Date().toISOString(),
                word_count: calculateWordCount(newContent),
                locations: extractLocations(newContent) as unknown as MemoInsert['locations'],
            })
            .eq('id', memo.id);
    }));

    const hasError = results.some(r => r.error);
    if (hasError) return { success: false, error: '部分更新失败' };

    revalidatePath('/');
    return { success: true, error: null };
}

/**
 * 验证解锁口令
 */
export async function verifyUnlockCode(memoId: string, code: string): Promise<ActionResponse> {
    const supabase = await getAdminClient();
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('id', memoId)
        .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memoData = data as any;

    if (error || !memoData?.access_code_hash) {
        return { success: false, error: '未设置访问口令' };
    }

    const isValid = bcrypt.compareSync(code, memoData.access_code_hash);
    if (!isValid) {
        return { success: false, error: '口令错误' };
    }

    // 设置 HttpOnly Cookie 授权访问
    const cookieStore = await cookies();
    cookieStore.set('memo_access_code', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { success: true, error: null };
}

// Alias for legacy usage
export const unlockWithCode = verifyUnlockCode;

/**
 * 清除解锁口令
 */
export async function clearUnlockCode(): Promise<ActionResponse> {
    const cookieStore = await cookies();
    cookieStore.delete('memo_access_code');
    return { success: true, error: null };
}
