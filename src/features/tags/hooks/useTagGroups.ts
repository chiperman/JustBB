"use client"

import { useState, useEffect, useCallback } from "react"
import { usePageDataCache } from "@/state/PageDataCache"
import { getAllTags } from "@/server/actions/memos/analytics"
import { shouldRefreshMemoDerivedData, useMemoSync } from "@/lib/memos/events"
import { getTagsCacheKey } from "@/shared/lib/page-cache-keys"
import { useUser } from "@/state/UserContext"

export interface TagData {
  tag_name: string
  count: number
}

export function useTagGroups(initialTags?: TagData[]) {
  const { getCache, setCache } = usePageDataCache()
  const { user } = useUser()
  const cacheKey = getTagsCacheKey(user?.id)
  const cached = getCache(cacheKey)
  const [tags, setTags] = useState<TagData[]>(initialTags ?? cached?.tags ?? [])
  const [isLoading, setIsLoading] = useState(!initialTags && !cached)
  const [previousCacheKey, setPreviousCacheKey] = useState(cacheKey)

  if (cacheKey !== previousCacheKey) {
    const nextCached = getCache(cacheKey)
    setPreviousCacheKey(cacheKey)
    setTags(nextCached?.tags ?? [])
    setIsLoading(!nextCached)
  }

  const refreshTags = useCallback(async () => {
    const res = await getAllTags()
    const result = res.success ? res.data || [] : []
    setTags(result)
    setCache(cacheKey, { tags: result })
    setIsLoading(false)
  }, [cacheKey, setCache])

  useEffect(() => {
    if (initialTags) {
      setCache(cacheKey, { tags: initialTags })
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await getAllTags()
      if (!cancelled) {
        const result = res.success ? res.data || [] : []
        setTags(result)
        setCache(cacheKey, { tags: result })
        setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cacheKey, initialTags, setCache])

  useMemoSync(
    useCallback(
      (payload) => {
        if (shouldRefreshMemoDerivedData(payload)) {
          void refreshTags()
        }
      },
      [refreshTags]
    )
  )

  return { tags, isLoading, refreshTags }
}
