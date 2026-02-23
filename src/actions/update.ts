'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { Database } from '@/types/database';
import { Memo } from '@/types/memo';
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
    const updateData: Database['public']['Tables']['memos']['Update'] = {};

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

    const supabase = await createClient();
    const { error } = await supabase
        .from('memos')
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

    // 从内容中提取定位信息
    const locationRegex = /📍\[([^\]]+)\]\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/g;
    const locations: { name: string; lat: number; lng: number }[] = [];
    let locMatch;
    while ((locMatch = locationRegex.exec(content)) !== null) {
        locations.push({
            name: locMatch[1],
            lat: parseFloat(locMatch[2]),
            lng: parseFloat(locMatch[3]),
        });
    }

    const supabase = await createClient();
    const { data: updatedData, error } = await supabase
        .from('memos')
        .update({
            content,
            tags,
            is_private,
            is_pinned,
            pinned_at: is_pinned ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            word_count: content.trim().length,
            locations: locations.length > 0 ? JSON.parse(JSON.stringify(locations)) : [],
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating memo content:', error);
        return { error: '内容更新失败' };
    }

    revalidatePath('/');
    // Explicitly cast the returned data to Memo if needed, or rely on inference if mapped correctly.
    // However, to satisfy strictly typed return:
    return { success: true, data: updatedData as unknown as Memo };
}
export async function batchAddTagsToMemos(ids: string[], tags: string[]) {
    if (!await isAdmin()) return { success: false, error: '权限不足' };
    if (ids.length === 0 || tags.length === 0) return { success: true };

    const supabase = await createClient();

    // 获取当前标签和内容以便合并
    const { data: memos, error: fetchError } = await supabase
        .from('memos')
        .select('id, tags, content')
        .in('id', ids);

    if (fetchError) {
        console.error('Error fetching memos for batch tagging:', fetchError);
        return { success: false, error: '获取笔记数据失败' };
    }

    // 并行更新
    const results = await Promise.all(memos.map(memo => {
        const existingTags = memo.tags || [];
        const combinedTags = Array.from(new Set([...existingTags, ...tags]));

        let newContent = memo.content || '';
        const tagsToAppend = tags.filter(tag => {
            // 检查内容中是否已经包含该标签（以 #tag 形式）
            const hashtag = `#${tag}`;
            const escapedTag = hashtag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?:^|\\s|(?<=[^a-zA-Z0-9]))${escapedTag}(?:$|\\s|(?=[^a-zA-Z0-9]))`, 'g');
            return !regex.test(newContent);
        });

        if (tagsToAppend.length > 0) {
            const appendStr = ' ' + tagsToAppend.map(t => `#${t}`).join(' ');
            newContent = newContent.trimEnd() + appendStr;
        }

        return supabase
            .from('memos')
            .update({
                tags: combinedTags,
                content: newContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', memo.id);
    }));

    const hasError = results.some(r => r.error);

    if (hasError) {
        console.error('Some batch tag updates failed');
        return { success: false, error: '部分笔记标签更新失败' };
    }

    revalidatePath('/');
    return { success: true };
}
