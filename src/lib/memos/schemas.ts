import { z } from 'zod';

/**
 * 基础 Memo 内容 Schema
 */
export const memoContentSchema = z.object({
    content: z.string().min(1, '内容不能为空'),
    is_pinned: z.boolean().default(false),
    is_private: z.boolean().default(false),
    access_code_hint: z.string().optional().nullable(),
    access_code: z.string().optional().nullable(),
});

/**
 * 创建 Memo 的 Schema
 */
export const createMemoSchema = memoContentSchema;

/**
 * 更新 Memo 内容的 Schema
 */
export const updateMemoContentSchema = memoContentSchema.extend({
    id: z.string().uuid('无效的 ID'),
});

/**
 * 更新状态的 Schema (Patch)
 */
export const updateMemoStateSchema = z.object({
    id: z.string().uuid('无效的 ID'),
    is_pinned: z.boolean().optional(),
    is_private: z.boolean().optional(),
    access_code_hint: z.string().optional().nullable(),
    access_code: z.string().optional().nullable(),
});

/**
 * 批量添加标签的 Schema
 */
export const batchAddTagsSchema = z.object({
    ids: z.array(z.string().uuid('无效的 ID')).min(1, '请至少选择一条记录'),
    tags: z.array(z.string()).min(1, '请至少选择一个标签'),
});

/**
 * 笔记查询参数 Schema
 */
export const fetchMemosSchema = z.object({
    query: z.string().optional().default(''),
    adminCode: z.string().optional().default(''),
    limit: z.number().int().min(1).max(100).optional().default(20),
    offset: z.number().int().min(0).optional().default(0),
    tag: z.string().nullable().optional(),
    num: z.string().nullable().optional(),
    date: z.string().nullable().optional(),
    year: z.string().nullable().optional(),
    month: z.string().nullable().optional(),
    sort: z.enum(['newest', 'oldest']).optional().default('newest'),
    after_date: z.string().nullable().optional(),
    before_date: z.string().nullable().optional(),
    excludePinned: z.boolean().optional().default(false),
});

export type CreateMemoInput = z.infer<typeof createMemoSchema>;
export type UpdateMemoContentInput = z.infer<typeof updateMemoContentSchema>;
export type UpdateMemoStateInput = z.infer<typeof updateMemoStateSchema>;
export type FetchMemosInput = z.infer<typeof fetchMemosSchema>;

