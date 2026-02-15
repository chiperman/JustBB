'use server';

import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { isAdmin } from './auth';

const UpdateMemoSchema = z.object({
    id: z.string(),
    is_private: z.boolean().optional(),
    is_pinned: z.boolean().optional(),
    access_code: z.string().optional(),
    access_code_hint: z.string().optional(),
});

export async function updateMemoState(formData: FormData) {
    if (!await isAdmin()) {
        return { error: '权限不足' };
    }
    const rawData = {
        id: formData.get('id') as string,
        is_private: formData.has('is_private') ? formData.get('is_private') === 'true' : undefined,
        is_pinned: formData.has('is_pinned') ? formData.get('is_pinned') === 'true' : undefined,
        access_code: formData.get('access_code') as string || undefined,
        access_code_hint: formData.get('access_code_hint') as string || undefined,
    };

    const validated = UpdateMemoSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: '参数校验失败' };
    }

    const { id, is_private, is_pinned, access_code, access_code_hint } = validated.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (is_private !== undefined) updateData.is_private = is_private;
    if (is_pinned !== undefined) {
        updateData.is_pinned = is_pinned;
        // 置顶时设置 pinned_at，取消置顶时清空
        updateData.pinned_at = is_pinned ? new Date().toISOString() : null;
    }
    if (access_code_hint !== undefined) updateData.access_code_hint = access_code_hint;

    // 如果设置了新的 access_code，需要加密存储
    if (access_code) {
        const salt = bcrypt.genSaltSync(10);
        updateData.access_code = bcrypt.hashSync(access_code, salt);
    }

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('memos') as any)
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Error updating memo state:', error);
        return { error: '状态更新失败' };
    }

    revalidatePath('/');
    return { success: true };
}

const UpdateMemoContentSchema = z.object({
    id: z.string(),
    content: z.string().min(1, '内容不能为空'),
    tags: z.array(z.string()).optional(),
    is_private: z.boolean().optional(),
    is_pinned: z.boolean().optional(),
});

export async function updateMemoContent(formData: FormData) {
    if (!await isAdmin()) {
        return { error: '权限不足' };
    }
    const rawData = {
        id: formData.get('id') as string,
        content: formData.get('content') as string,
        tags: formData.getAll('tags') as string[],
        is_private: formData.get('is_private') === 'true',
        is_pinned: formData.get('is_pinned') === 'true',
    };

    const validated = UpdateMemoContentSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: '参数校验失败: ' + validated.error.issues[0].message };
    }

    const { id, content, tags, is_private, is_pinned } = validated.data;

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedData, error } = await (supabase.from('memos') as any)
        .update({
            content,
            tags,
            is_private,
            is_pinned,
            pinned_at: is_pinned ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            word_count: content.trim().length
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating memo content:', error);
        return { error: '更新失败' };
    }

    revalidatePath('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { success: true, data: updatedData as any };
}
