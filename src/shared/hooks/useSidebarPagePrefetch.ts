"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getGalleryMemos, getMemosWithLocations } from "@/server/actions/memos/query"
import { locationCache } from "@/shared/lib/location-cache"
import { groupMemosByLocation } from "@/shared/lib/map-markers"
import { getGalleryCacheKey, getMapCacheKey } from "@/shared/lib/page-cache-keys"
import { usePageDataCache } from "@/state/PageDataCache"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"

const HOVER_PREFETCH_DELAY_MS = 150
const GALLERY_INITIAL_PAGE_SIZE = 20

export function useSidebarPagePrefetch() {
  const router = useRouter()
  const { getCache, setCache } = usePageDataCache()
  const { unlockedMemoIds } = useUnlockedMemos()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const prefetchPage = useCallback(
    async (href: string) => {
      router.prefetch(href)

      if (href === "/gallery") {
        const cacheKey = getGalleryCacheKey(unlockedMemoIds)
        if (getCache(cacheKey)?.memos || pendingRef.current.has(cacheKey)) return

        pendingRef.current.add(cacheKey)
        try {
          const res = await getGalleryMemos(GALLERY_INITIAL_PAGE_SIZE, 0, unlockedMemoIds)
          if (res.success) {
            const memos = res.data || []
            setCache(cacheKey, { memos, hasMore: memos.length >= GALLERY_INITIAL_PAGE_SIZE })
          }
        } finally {
          pendingRef.current.delete(cacheKey)
        }
        return
      }

      if (href === "/map") {
        const cacheKey = getMapCacheKey(unlockedMemoIds)
        if (getCache(cacheKey)?.markers || pendingRef.current.has(cacheKey)) return

        pendingRef.current.add(cacheKey)
        try {
          const res = await getMemosWithLocations(unlockedMemoIds)
          if (res.success) {
            const memos = res.data || []
            const markers = groupMemosByLocation(memos)
            locationCache.setMarkers(markers)
            setCache(cacheKey, { markers, memos })
          }
        } finally {
          pendingRef.current.delete(cacheKey)
        }
      }
    },
    [getCache, router, setCache, unlockedMemoIds]
  )

  const schedulePrefetch = useCallback(
    (href: string) => {
      if (href !== "/gallery" && href !== "/map") return

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null
        void prefetchPage(href)
      }, HOVER_PREFETCH_DELAY_MS)
    },
    [prefetchPage]
  )

  const cancelPrefetch = useCallback(() => {
    if (!timerRef.current) return

    clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  return { schedulePrefetch, cancelPrefetch }
}
