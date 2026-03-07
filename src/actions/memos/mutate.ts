'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getClient } from '@/lib/supabase';
import { ActionResponse } from '../shared/types';
import { Memo } from '@/types/memo';
import { isAdmin } from '../auth';
import { calculateWordCount, extractLocations, extractTags } from '@/lib/memos/parser';

/**
 * 创建笔记
 */
export async function createMemo(formData: FormData): Promise<ActionResponse<Memo>> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const content = formData.get('content') as string;
    if (!content) return { success: false, error: '内容不能为空' };

    const access_code = formData.get('access_code') as string || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = {
        content,
        tags: extractTags(content),
        is_private: formData.get('is_private') === 'true',
        is_pinned: formData.get('is_pinned') === 'true',
        access_code_hint: formData.get('access_code_hint') as string || undefined,
        word_count: calculateWordCount(content),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        locations: extractLocations(content) as any,
    };

    if (access_code) {
        const salt = await bcrypt.genSalt(10);
        insertData.access_code = await bcrypt.hash(access_code, salt);
    }

    if (insertData.is_pinned) {
        insertData.pinned_at = new Date().toISOString();
    }

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error('Error creating memo:', error);
        return { success: false, error: '创建失败' };
    }

    revalidatePath('/');
    return { success: true, error: null, data: data as unknown as Memo };
}

/**
 * 更新笔记内容
 */
export async function updateMemoContent(formData: FormData): Promise<ActionResponse<Memo>> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const id = formData.get('id') as string;
    const content = formData.get('content') as string;
    if (!id || !content) return { success: false, error: '参数缺失' };

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .update({
            content,
            tags: extractTags(content),
            is_private: formData.get('is_private') === 'true',
            is_pinned: formData.get('is_pinned') === 'true',
            pinned_at: formData.get('is_pinned') === 'true' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            word_count: calculateWordCount(content),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            locations: extractLocations(content) as any,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating memo:', error);
        return { success: false, error: '更新失败' };
    }

    revalidatePath('/');
    return { success: true, error: null, data: data as unknown as Memo };
}

/**
 * 更新笔记状态（仅开关量）
 */
export async function updateMemoState(formData: FormData): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    const id = formData.get('id') as string;
    if (!id) return { success: false, error: 'ID 缺失' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (formData.has('is_private')) updateData.is_private = formData.get('is_private') === 'true';
    if (formData.has('is_pinned')) {
        const isPinned = formData.get('is_pinned') === 'true';
        updateData.is_pinned = isPinned;
        updateData.pinned_at = isPinned ? new Date().toISOString() : null;
    }
    if (formData.has('access_code_hint')) updateData.access_code_hint = formData.get('access_code_hint');

    const access_code = formData.get('access_code') as string | null;
    if (access_code) {
        const salt = await bcrypt.genSalt(10);
        updateData.access_code = await bcrypt.hash(access_code, salt);
    }

    const supabase = await getClient();
    const { error } = await supabase
        .from('memos')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Error updating state:', error);
        return { success: false, error: '状态更新失败' };
    }

    revalidatePath('/');
    return { success: true, error: null };
}

/**
 * 批量为笔记添加标签
 */
export async function batchAddTagsToMemos(ids: string[], tags: string[]): Promise<ActionResponse> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    if (ids.length === 0 || tags.length === 0) return { success: true, error: null };

    const supabase = await getClient();
    const { data: memos, error: fetchError } = await supabase
        .from('memos')
        .select('id, tags, content')
        .in('id', ids);

    if (fetchError) return { success: false, error: '获取笔记失败' };

    const results = await Promise.all(memos.map(memo => {
        const existingTags = memo.tags || [];
        const combinedTags = Array.from(new Set([...existingTags, ...tags]));

        let newContent = memo.content || '';
        const tagsToAppend = tags.filter(tag => !new RegExp(`#${tag}\\b`).test(newContent));

        if (tagsToAppend.length > 0) {
            newContent = newContent.trimEnd() + ' ' + tagsToAppend.map(t => `#${t}`).join(' ');
        }

        return supabase
            .from('memos')
            .update({
                tags: combinedTags,
                content: newContent,
                updated_at: new Date().toISOString(),
                word_count: calculateWordCount(newContent),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                locations: extractLocations(newContent) as any,
            })
            .eq('id', memo.id);
    }));

    if (results.some(r => r.error)) return { success: false, error: '部分操作失败' };

    revalidatePath('/');
    return { success: true, error: null };
}

/**
 * 使用口令解锁
 */
export async function unlockWithCode(code: string): Promise<{ success: boolean; error?: string }> {
    if (!code) return { success: false, error: '请输入口令' };

    const cookieStore = await cookies();
    cookieStore.set('memo_access_code', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    return { success: true };
}

/**
 * 清除解锁口令
 */
export async function clearUnlockCode() {
    const cookieStore = await cookies();
    cookieStore.delete('memo_access_code');
}
