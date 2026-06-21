import { z } from "zod"

const postgresUuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "无效的 ID")

const booleanPreprocessor = (val: unknown) => {
  if (typeof val === "string") return val.toLowerCase() === "true"
  return Boolean(val)
}

const optionalBooleanPreprocessor = (val: unknown) => {
  if (val === undefined || val === null || val === "") return undefined
  if (typeof val === "string") return val.toLowerCase() === "true"
  return Boolean(val)
}

const arrayPreprocessor = (val: unknown) => {
  if (typeof val === "string") {
    if (val.trim() === "") return []
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // 忽略 JSON 解析错误，继续按逗号分割
    }
    return val
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (Array.isArray(val)) return val
  return []
}

/**
 * 基础 Memo 内容 Schema
 */
export const memoContentSchema = z
  .object({
    content: z.string(),
    is_pinned: z.preprocess(booleanPreprocessor, z.boolean().default(false)),
    is_private: z.preprocess(booleanPreprocessor, z.boolean().default(false)),
    access_code_hint: z.string().optional().nullable(),
    access_code: z.string().optional().nullable(),
    images: z.preprocess(arrayPreprocessor, z.array(z.string()).optional().default([])),
  })
  .superRefine((data, ctx) => {
    if (data.content.trim() || data.images.length > 0) return

    ctx.addIssue({
      code: "custom",
      path: ["content"],
      message: "内容不能为空",
    })
  })

/**
 * 创建 Memo 的 Schema
 */
export const createMemoSchema = memoContentSchema

/**
 * 更新 Memo 内容的 Schema
 */
export const updateMemoContentSchema = memoContentSchema.extend({
  id: postgresUuidSchema,
})

/**
 * 更新状态的 Schema (Patch)
 */
export const updateMemoStateSchema = z.object({
  id: postgresUuidSchema,
  is_pinned: z.preprocess(optionalBooleanPreprocessor, z.boolean().optional()),
  is_private: z.preprocess(optionalBooleanPreprocessor, z.boolean().optional()),
  access_code_hint: z.string().optional().nullable(),
  access_code: z.string().optional().nullable(), // 原始口令输入，由 Action 负责哈希
})

export const batchAddTagsSchema = z.object({
  ids: z.preprocess(arrayPreprocessor, z.array(postgresUuidSchema).min(1, "请至少选择一条记录")),
  tags: z.preprocess(arrayPreprocessor, z.array(z.string()).optional().default([])),
  removeTags: z.preprocess(arrayPreprocessor, z.array(z.string()).optional().default([])),
})

/**
 * 笔记查询参数 Schema
 */
export const fetchMemosSchema = z.object({
  query: z.string().optional().default(""),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  tag: z.string().nullable().optional(),
  num: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  tagMode: z.enum(["and", "or"]).optional().default("and"),
  after_date: z.string().nullable().optional(),
  before_date: z.string().nullable().optional(),
  excludePinned: z.preprocess(optionalBooleanPreprocessor, z.boolean().optional().default(false)),
  unlockedMemoIds: z
    .array(
      z
        .string()
        .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "无效的 Memo ID")
    )
    .optional()
    .default([]),
})

export type CreateMemoInput = z.infer<typeof createMemoSchema>
export type UpdateMemoContentInput = z.infer<typeof updateMemoContentSchema>
export type UpdateMemoStateInput = z.infer<typeof updateMemoStateSchema>
export type FetchMemosInput = z.infer<typeof fetchMemosSchema>
