'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getClient } from '@/lib/supabase';
import { ActionResponse } from '../shared/types';
import { Memo } from '@/types/memo';
import { isAdmin } from '../auth';
import { buildMemoPayload } from './helpers';
import { calculateWordCount, extractLocations } from '@/lib/memos/parser';
import { Database } from '@/types/database';
import { createMemoSchema, updateMemoContentSchema, updateMemoStateSchema, batchAddTagsSchema } from '@/lib/memos/schemas';

type MemoInsert = Database['public']['Tables']['memos']['Insert'];

/**
 * 创建笔记
 */
export async function createMemo(formData: FormData): Promise<ActionResponse<Memo>> {
    if (!await isAdmin()) return { success: false, error: '权限不足' };

    // 数据提取与校验
    const validation = createMemoSchema.safeParse({
        content: formData.get('content'),
        is_pinned: formData.get('is_pinned') === 'true',
        is_private: formData.get('is_private') === 'true',
        access_code_hint: formData.get('access_code_hint'),
        access_code: formData.get('access_code'),
    });

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { content, is_pinned, is_private, access_code_hint, access_code } = validation.data;

    const insertData: MemoInsert = {
        ...buildMemoPayload(content, { isPinned: is_pinned }),
        is_private,
        access_code_hint,
    };

    if (access_code) {
        const salt = await bcrypt.genSalt(10);
        insertData.access_code = await bcrypt.hash(access_code, salt);
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

    // 数据提取与校验
    const validation = updateMemoContentSchema.safeParse({
        id: formData.get('id'),
        content: formData.get('content'),
        is_pinned: formData.get('is_pinned') === 'true',
        is_private: formData.get('is_private') === 'true',
        access_code_hint: formData.get('access_code_hint'),
    });

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { id, content, is_pinned, is_private, access_code_hint } = validation.data;

    const supabase = await getClient();
    const { data, error } = await supabase
        .from('memos')
        .update({
            ...buildMemoPayload(content, { isPinned: is_pinned }),
            is_private,
            access_code_hint,
            updated_at: new Date().toISOString(),
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

    // 数据提取与校验
    const validation = updateMemoStateSchema.safeParse({
        id: formData.get('id'),
        is_pinned: formData.has('is_pinned') ? formData.get('is_pinned') === 'true' : undefined,
        is_private: formData.has('is_private') ? formData.get('is_private') === 'true' : undefined,
        access_code_hint: formData.has('access_code_hint') ? formData.get('access_code_hint') : undefined,
        access_code: formData.get('access_code'),
    });

    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { id, is_pinned, is_private, access_code_hint, access_code } = validation.data;

    const updateData: Record<string, unknown> = {};
    if (is_private !== undefined) updateData.is_private = is_private;
    if (is_pinned !== undefined) {
        updateData.is_pinned = is_pinned;
        updateData.pinned_at = is_pinned ? new Date().toISOString() : null;
    }
    if (access_code_hint !== undefined) updateData.access_code_hint = access_code_hint;

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

    // 数据校验
    const validation = batchAddTagsSchema.safeParse({ ids, tags });
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const { ids: validIds, tags: validTags } = validation.data;

    const supabase = await getClient();
    const { data: memos, error: fetchError } = await supabase
        .from('memos')
        .select('id, tags, content')
        .in('id', validIds);

    if (fetchError) return { success: false, error: '获取笔记失败' };

    const results = await Promise.all(memos.map(memo => {
        const existingTags = memo.tags || [];
        const combinedTags = Array.from(new Set([...existingTags, ...validTags]));

        let newContent = memo.content || '';
        const tagsToAppend = validTags.filter(tag => !new RegExp(`#${tag}\\b`).test(newContent));

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
                locations: extractLocations(newContent) as unknown as MemoInsert['locations'],
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
export async function unlockWithCode(code: string): Promise<ActionResponse> {
    if (!code) return { success: false, error: '请输入口令' };

    const cookieStore = await cookies();
    cookieStore.set('memo_access_code', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    return { success: true, error: null };
}


/**
 * 清除解锁口令
 */
export async function clearUnlockCode(): Promise<ActionResponse> {
    const cookieStore = await cookies();
    cookieStore.delete('memo_access_code');
    return { success: true, error: null };
}
