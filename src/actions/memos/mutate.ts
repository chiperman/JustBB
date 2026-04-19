'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getClient, getAdminClient } from '@/lib/supabase';
import { ActionResponse } from '../shared/types';
import { Memo } from '@/types/memo';
import { getCurrentUserId } from '@/features/auth/actions';
import { calculateWordCount, extractLocations, mergeTagsIntoContent } from '@/lib/memos/parser';
import { Database } from '@/types/database';
import { createMemoSchema, updateMemoContentSchema, updateMemoStateSchema, batchAddTagsSchema } from '@/lib/memos/schemas';
import { withViewerAccess } from '@/lib/memos/visibility';

type MemoInsert = Database['public']['Tables']['memos']['Insert'];

/**
 * 创建新笔记
 */
export async function createMemo(formData: FormData): Promise<ActionResponse<Memo>> {
    const viewerId = await getCurrentUserId();
    if (!viewerId) return { success: false, error: '请先登录' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = createMemoSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { content, is_private, is_pinned, access_code, access_code_hint } = validation.data;
    const supabase = await getClient();

    const payload: Partial<MemoInsert> = {
        owner_id: viewerId,
        content,
        is_private,
        is_pinned,
        word_count: calculateWordCount(content),
        locations: extractLocations(content) as unknown as MemoInsert['locations'],
    };

    if (is_private && access_code) {
        const salt = bcrypt.genSaltSync(10);
        payload.access_code_hash = bcrypt.hashSync(access_code, salt);
        payload.access_code_hint = access_code_hint || null;
    }

    const { data, error } = await supabase
        .from('memos')
        .insert(payload as MemoInsert)
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
    const viewerId = await getCurrentUserId();
    if (!viewerId) return { success: false, error: '请先登录' };

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
        .eq('owner_id', viewerId)
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
    const viewerId = await getCurrentUserId();
    if (!viewerId) return { success: false, error: '请先登录' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = updateMemoStateSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { id, is_pinned, is_private, access_code, access_code_hint } = validation.data;
    const supabase = await getClient();

    const updatePayload: Partial<MemoInsert> = {};
    if (is_pinned !== undefined) updatePayload.is_pinned = is_pinned;
    
    if (is_private !== undefined) {
        updatePayload.is_private = is_private;
        if (is_private && access_code) {
            const salt = bcrypt.genSaltSync(10);
            updatePayload.access_code_hash = bcrypt.hashSync(access_code, salt);
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
        .eq('owner_id', viewerId)
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
    const viewerId = await getCurrentUserId();
    if (!viewerId) return { success: false, error: '请先登录' };

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
        .eq('owner_id', viewerId)
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
export async function verifyUnlockCode(memoId: string, code: string): Promise<ActionResponse<Memo>> {
    if (!memoId) {
        return { success: false, error: '缺少 Memo ID' };
    }

    const viewerId = await getCurrentUserId();
    const supabase = await getAdminClient();
    const { data, error } = await supabase
        .from('memos')
        .select('id, memo_number, owner_id, content, tags, access_code_hint, is_private, is_pinned, pinned_at, created_at, updated_at, deleted_at, word_count, locations, access_code_hash')
        .eq('id', memoId)
        .single();

    if (error || !data) {
        return { success: false, error: '记录不存在' };
    }

    if (viewerId && data.owner_id === viewerId) {
        return {
            success: true,
            error: null,
            data: withViewerAccess(data as unknown as Memo, viewerId, [memoId]) as Memo,
        };
    }

    if (!data.access_code_hash) {
        return { success: false, error: '未设置访问口令' };
    }

    const isValid = bcrypt.compareSync(code, data.access_code_hash);
    if (!isValid) {
        return { success: false, error: '口令错误' };
    }

    return {
        success: true,
        error: null,
        data: withViewerAccess(data as unknown as Memo, viewerId, [memoId]) as Memo,
    };
}

// Alias for legacy usage
export const unlockWithCode = verifyUnlockCode;

/**
 * 清除解锁口令
 */
export async function clearUnlockCode(): Promise<ActionResponse> {
    return { success: true, error: null };
}
