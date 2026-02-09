'use server';

import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { Memo } from '@/types/memo';

const CreateMemoSchema = z.object({
    content: z.string().min(1, '内容不能为空'),
    tags: z.array(z.string()).optional().default([]),
    is_private: z.boolean().optional().default(false),
    is_pinned: z.boolean().optional().default(false),
    access_code: z.string().optional(),
    access_code_hint: z.string().optional(),
});

export async function createMemo(formData: FormData): Promise<{ success: boolean; error: string | null; data?: Memo }> { // Added return type and data?: Memo
    const rawData = {
        content: formData.get('content') as string,
        tags: formData.getAll('tags') as string[],
        is_private: formData.get('is_private') === 'true',
        is_pinned: formData.get('is_pinned') === 'true',
        access_code: formData.get('access_code') as string || undefined,
        access_code_hint: formData.get('access_code_hint') as string || undefined,
    };

    const validated = CreateMemoSchema.safeParse(rawData);

    if (!validated.success) {
        // Simplified error return to match the new return type
        return { success: false, error: validated.error.flatten().fieldErrors.content?.[0] || '输入验证失败' };
    }

    const { access_code, ...rest } = validated.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = { ...rest };

    if (access_code) {
        const salt = bcrypt.genSaltSync(10);
        insertData.access_code = bcrypt.hashSync(access_code, salt);
    }

    // 计算字数
    insertData.word_count = validated.data.content.trim().length;

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('memos') as any)
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error('Error creating memo:', error);
        return { success: false, error: '创建失败，请稍后重试' };
    }

    revalidatePath('/');
    return { success: true, error: null, data: data as Memo }; // Ensured data is returned as Memo type
}
