"use client"

import { useCallback, useEffect, useRef } from "react"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { useUser } from "@/state/UserContext"
import { withVisibilityScope } from "@/shared/lib/page-cache-keys"
import { generateCacheKey } from "@/shared/lib/utils"

type ViewerQueryFn<Args extends unknown[], Result> = (
  ...args: [...Args, string[]]
) => Promise<Result>

/**
 * 「带着查看者身份发起一次 memo 查询」的唯一入口。
 *
 * 隐私不变量集中在这里：查询必须携带当前解锁集合，缓存 key 必须包含
 * 查看者与解锁集合。消费方拿不到 unlockedMemoIds——漏传在类型层面不可能。
 * 需要读取解锁内容本身（而非发起查询）的场景，继续使用 UnlockedMemosContext。
 */
export function useViewerQuery() {
  const { user } = useUser()
  const { unlockedMemoIds } = useUnlockedMemos()

  // query 保持引用稳定，且始终读到最新解锁集合。
  const unlockedMemoIdsRef = useRef(unlockedMemoIds)
  useEffect(() => {
    unlockedMemoIdsRef.current = unlockedMemoIds
  }, [unlockedMemoIds])

  const viewerId = user?.id

  const cacheKey = useCallback(
    (path: string, searchParams?: Record<string, string | string[] | undefined>) =>
      withVisibilityScope(
        searchParams ? generateCacheKey(searchParams) : path,
        viewerId,
        unlockedMemoIds
      ),
    [viewerId, unlockedMemoIds]
  )

  const query = useCallback(
    <Args extends unknown[], Result>(
      run: ViewerQueryFn<Args, Result>,
      ...args: Args
    ): Promise<Result> => run(...args, unlockedMemoIdsRef.current),
    []
  )

  return { cacheKey, query }
}
