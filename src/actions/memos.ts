'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { Memo } from '@/types/memo';
import { Database } from '@/types/database';
import { isAdmin } from './auth';

const CreateMemoSchema = z.object({
    content: z.string().min(1, '内容不能为空'),
    tags: z.array(z.string()).optional().default([]),
    is_private: z.boolean().optional().default(false),
    is_pinned: z.boolean().optional().default(false),
    access_code: z.string().optional(),
    access_code_hint: z.string().optional(),
});

export async function createMemo(formData: FormData): Promise<{ success: boolean; error: string | null; data?: Memo }> {
    // 安全检查：只有管理员能创建
    if (!await isAdmin()) {
        return { success: false, error: '权限不足' };
    }

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
    const insertData: Database['public']['Tables']['memos']['Insert'] = { ...rest };

    if (access_code) {
        const salt = await bcrypt.genSalt(10);
        insertData.access_code = await bcrypt.hash(access_code, salt);
    }

    // 计算字数
    insertData.word_count = validated.data.content.trim().length;

    // 从内容中提取定位信息
    const locationRegex = /📍\[([^\]]+)\]\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/g;
    const locations: { name: string; lat: number; lng: number }[] = [];
    let locMatch;
    while ((locMatch = locationRegex.exec(validated.data.content)) !== null) {
        locations.push({
            name: locMatch[1],
            lat: parseFloat(locMatch[2]),
            lng: parseFloat(locMatch[3]),
        });
    }
    if (locations.length > 0) {
        insertData.locations = JSON.parse(JSON.stringify(locations));
    }

    // 如果设置了置顶，记录置顶时间
    if (insertData.is_pinned) {
        insertData.pinned_at = new Date().toISOString();
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('memos')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error('Error creating memo:', error);
        return { success: false, error: '创建失败，请稍后重试' };
    }

    revalidatePath('/');
    return { success: true, error: null, data: data as unknown as Memo }; // Ensured data is returned as Memo type
}
