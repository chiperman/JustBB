"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { getTrashMemos, emptyTrash } from "@/server/actions/memos/trash"
import { Memo } from "@/types/memo"
import { usePageDataCache } from "@/state/PageDataCache"
import { useToast } from "@/shared/hooks/use-toast"
import { useMemoSync } from "@/lib/memos/events"
import { getTrashCacheKey } from "@/shared/lib/page-cache-keys"
import { useUser } from "@/state/UserContext"

export function removeMemoFromTrash(memos: Memo[], id: string) {
  return memos.filter((memo) => memo.id !== id)
}

export function useTrashMemos() {
  const { getCache, setCache } = usePageDataCache()
  const { user } = useUser()
  const cacheKey = getTrashCacheKey(user?.id)
  const cached = getCache(cacheKey)

  const [memos, setMemos] = useState<Memo[]>(cached?.memos ?? [])
  const [isLoading, setIsLoading] = useState(!cached)
  const [previousCacheKey, setPreviousCacheKey] = useState(cacheKey)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  if (cacheKey !== previousCacheKey) {
    const nextCached = getCache(cacheKey)
    setPreviousCacheKey(cacheKey)
    setMemos(nextCached?.memos ?? [])
    setIsLoading(!nextCached)
  }

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const res = await getTrashMemos()
        if (isMounted && res.success) {
          const result = res.data || []
          setMemos(result)
          setCache(cacheKey, { memos: result })
        }
      } catch (error) {
        console.error("[Trash Hook] Load failed:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [cacheKey, setCache])

  useMemoSync(
    useCallback(
      (payload) => {
        if (payload.type !== "delete") return

        setMemos((prev) => {
          const next = removeMemoFromTrash(prev, payload.id)
          if (next.length !== prev.length) {
            setCache(cacheKey, { memos: next })
          }
          return next
        })
      },
      [cacheKey, setCache]
    )
  )

  const handleEmptyTrash = useCallback(() => {
    startTransition(async () => {
      const result = await emptyTrash()
      if (result.success) {
        toast({
          title: "回收站已清空",
          description: "所有记录已永久删除",
          variant: "destructive",
        })
        setMemos([])
        setCache(cacheKey, { memos: [] })
      } else {
        toast({
          title: "操作失败",
          description: result.error,
          variant: "destructive",
        })
      }
    })
  }, [cacheKey, setCache, toast])

  return {
    memos,
    isLoading,
    isPending,
    handleEmptyTrash,
  }
}
