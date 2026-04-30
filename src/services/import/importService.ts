import { supabase } from "@/lib/supabase"
import { ParsedMemo } from "./parsers"

export interface ImportError {
  summary: string
  message: string
}

export interface ImportResult {
  total: number
  success: number
  skipped: number
  failed: number
  errors: ImportError[]
}

export type ImportProgressCallback = (result: ImportResult) => void

const BATCH_SIZE = 50

/**
 * 执行数据导入
 */
export async function importMemos(
  memos: ParsedMemo[],
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  // 按时间正序排列（从旧到新），确保数据库分配的 memo_number 也是按时间顺序的
  const sortedMemos = [...memos].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const result: ImportResult = {
    total: sortedMemos.length,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  // 获取当前用户 ID
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("未登录，无法导入数据")

  // 分批处理
  for (let i = 0; i < sortedMemos.length; i += BATCH_SIZE) {
    const batch = sortedMemos.slice(i, i + BATCH_SIZE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toInsert: any[] = []

    for (const memo of batch) {
      try {
        let isDuplicate = false

        // 1. 如果有 ID，检查 ID 是否冲突
        if (memo.id) {
          const { data } = await supabase
            .from("memos")
            .select("id")
            .eq("id", memo.id)
            .single()
          if (data) isDuplicate = true
        }

        // 2. 检查内容和创建时间是否完全一致
        if (!isDuplicate) {
          const { data } = await supabase
            .from("memos")
            .select("id")
            .eq("owner_id", user.id)
            .eq("content", memo.content)
            .eq("created_at", memo.created_at)
            .maybeSingle()
          if (data) isDuplicate = true
        }

        if (isDuplicate) {
          result.skipped++
        } else {
          // 准备插入的数据，确保 owner_id 正确
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { memo_number, ...insertData } = memo as unknown as Record<
            string,
            unknown
          >
          toInsert.push({
            ...insertData,
            owner_id: user.id,
          })
        }
      } catch (err) {
        console.error("检查重复失败:", err)
        // 如果查询失败，保守起见先标记为失败或跳过
        result.failed++
        result.errors.push({
          summary: memo.content.slice(0, 30),
          message: "检查重复数据时出错",
        })
      }
    }

    // 执行批量插入
    if (toInsert.length > 0) {
      const { error } = await supabase.from("memos").insert(toInsert)
      if (error) {
        console.error("批量插入失败:", error)
        result.failed += toInsert.length
        result.errors.push({
          summary: `批处理失败 (${toInsert.length} 条记录)`,
          message: error.message,
        })
      } else {
        result.success += toInsert.length
      }
    }

    onProgress?.({ ...result })
  }

  return result
}
