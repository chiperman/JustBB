"use client"

import { useState, useEffect } from "react"
import { usePageDataCache } from "@/state/PageDataCache"
import { getAllTags } from "@/server/actions/memos/analytics"

export interface TagData {
  tag_name: string
  count: number
}

export function useTagGroups(initialTags?: TagData[]) {
  const { getCache, setCache } = usePageDataCache()
  const cached = getCache("/tags")
  const [tags, setTags] = useState<TagData[]>(initialTags ?? cached?.tags ?? [])
  const [isLoading, setIsLoading] = useState(!initialTags && !cached)

  useEffect(() => {
    if (initialTags) {
      setCache("/tags", { tags: initialTags })
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await getAllTags()
      if (!cancelled) {
        const result = res.success ? res.data || [] : []
        setTags(result)
        setCache("/tags", { tags: result })
        setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialTags, setCache])

  return { tags, isLoading }
}
