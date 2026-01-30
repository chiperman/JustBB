'use server';

import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

const UpdateMemoSchema = z.object({
    id: z.string(),
    is_private: z.boolean().optional(),
    is_pinned: z.boolean().optional(),
    access_code: z.string().optional(),
    access_code_hint: z.string().optional(),
});

export async function updateMemoState(formData: FormData) {
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
    const updateData: any = {};

    if (is_private !== undefined) updateData.is_private = is_private;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (access_code_hint !== undefined) updateData.access_code_hint = access_code_hint;

    // 如果设置了新的 access_code，需要加密存储
    if (access_code) {
        const salt = bcrypt.genSaltSync(10);
        updateData.access_code = bcrypt.hashSync(access_code, salt);
    }

    const supabase = getSupabaseAdmin();
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
