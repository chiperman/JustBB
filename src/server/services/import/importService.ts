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
const EXISTING_MEMOS_PAGE_SIZE = 1_000

function addMemoToDuplicateIndex(
  duplicateIndex: Map<string, Set<string>>,
  memo: Pick<ParsedMemo, "content" | "created_at">
) {
  const createdAtValues = duplicateIndex.get(memo.content) ?? new Set<string>()
  createdAtValues.add(memo.created_at)
  duplicateIndex.set(memo.content, createdAtValues)
}

/**
 * 执行数据导入
 */
export async function importMemos(
  memos: ParsedMemo[],
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  // 按时间正序排列（从旧到新），确保数据库分配的 memo_number 也是按时间顺序的
  const sortedMemos = [...memos].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

  const existingIds = new Set<string>()
  const idLookupFailed = new Set<string>()
  const importedIds = sortedMemos.flatMap((memo) => (memo.id ? [memo.id] : []))

  for (let i = 0; i < importedIds.length; i += BATCH_SIZE) {
    const ids = importedIds.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase.from("memos").select("id").in("id", ids)

    if (error) {
      ids.forEach((id) => idLookupFailed.add(id))
    } else {
      data?.forEach((memo) => existingIds.add(memo.id))
    }
  }

  const existingMemos: Pick<ParsedMemo, "content" | "created_at">[] = []
  let existingMemosError = false
  const duplicateIndex = new Map<string, Set<string>>()
  for (let from = 0; ; from += EXISTING_MEMOS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("memos")
      .select("content, created_at")
      .eq("owner_id", user.id)
      .range(from, from + EXISTING_MEMOS_PAGE_SIZE - 1)

    if (error) {
      existingMemosError = true
      break
    }

    const page = data ?? []
    existingMemos.push(...page)
    if (page.length < EXISTING_MEMOS_PAGE_SIZE) break
  }

  if (!existingMemosError) {
    for (const memo of existingMemos) {
      addMemoToDuplicateIndex(duplicateIndex, memo)
    }
  }

  // 分批处理
  for (let i = 0; i < sortedMemos.length; i += BATCH_SIZE) {
    const batch = sortedMemos.slice(i, i + BATCH_SIZE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toInsert: any[] = []
    const insertedMemos: ParsedMemo[] = []

    for (const memo of batch) {
      const idLookupError = memo.id && idLookupFailed.has(memo.id)
      const isDuplicate = memo.id ? existingIds.has(memo.id) : false

      if (idLookupError) {
        result.failed++
        result.errors.push({
          summary: memo.content.slice(0, 30),
          message: "检查重复数据时出错",
        })
      } else if (isDuplicate) {
        result.skipped++
      } else if (existingMemosError) {
        result.failed++
        result.errors.push({
          summary: memo.content.slice(0, 30),
          message: "检查重复数据时出错",
        })
      } else if (duplicateIndex.get(memo.content)?.has(memo.created_at) === true) {
        result.skipped++
      } else {
        // 准备插入的数据，确保 owner_id 正确
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { memo_number, ...insertData } = memo as unknown as Record<string, unknown>
        toInsert.push({
          ...insertData,
          owner_id: user.id,
        })
        insertedMemos.push(memo)
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
        for (const memo of insertedMemos) {
          addMemoToDuplicateIndex(duplicateIndex, memo)
          if (memo.id) existingIds.add(memo.id)
        }
      }
    }

    onProgress?.({ ...result })
  }

  return result
}
