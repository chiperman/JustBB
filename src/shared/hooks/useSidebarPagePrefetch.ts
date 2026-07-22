"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getGalleryMemos, getMemosWithLocations } from "@/server/actions/memos/query"
import { getAllTags } from "@/server/actions/memos/analytics"
import { groupMemosByLocation } from "@/shared/lib/map-markers"
import { getGalleryCacheKey, getMapCacheKey, getTagsCacheKey } from "@/shared/lib/page-cache-keys"
import { usePageDataCache } from "@/state/PageDataCache"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { useUser } from "@/state/UserContext"

const HOVER_PREFETCH_DELAY_MS = 150
const GALLERY_INITIAL_PAGE_SIZE = 20

interface NavigationConnection {
  effectiveType?: string
  saveData?: boolean
}

export function shouldSkipNavigationPrefetch() {
  if (typeof navigator === "undefined") return false
  if (navigator.onLine === false) return true

  const connection = (navigator as Navigator & { connection?: NavigationConnection }).connection
  return Boolean(
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  )
}

export function useSidebarPagePrefetch() {
  const router = useRouter()
  const { getCache, setCache } = usePageDataCache()
  const { unlockedMemoIds } = useUnlockedMemos()
  const { user } = useUser()
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
      if (shouldSkipNavigationPrefetch()) return

      try {
        router.prefetch(href)
      } catch {
        // Prefetch is opportunistic; normal navigation remains the fallback.
      }

      if (href === "/gallery") {
        const cacheKey = getGalleryCacheKey(user?.id, unlockedMemoIds)
        if (getCache(cacheKey)?.memos || pendingRef.current.has(cacheKey)) return

        pendingRef.current.add(cacheKey)
        try {
          const res = await getGalleryMemos(GALLERY_INITIAL_PAGE_SIZE, 0, unlockedMemoIds)
          if (res.success) {
            const memos = res.data || []
            setCache(cacheKey, { memos, hasMore: memos.length >= GALLERY_INITIAL_PAGE_SIZE })
          }
        } catch {
          // Ignore optional data prefetch failures.
        } finally {
          pendingRef.current.delete(cacheKey)
        }
        return
      }

      if (href === "/tags") {
        const cacheKey = getTagsCacheKey(user?.id)
        if (getCache(cacheKey)?.tags || pendingRef.current.has(cacheKey)) return

        pendingRef.current.add(cacheKey)
        try {
          const res = await getAllTags()
          if (res.success) {
            setCache(cacheKey, { tags: res.data || [] })
          }
        } catch {
          // Ignore optional data prefetch failures.
        } finally {
          pendingRef.current.delete(cacheKey)
        }
        return
      }

      if (href === "/map") {
        const cacheKey = getMapCacheKey(user?.id, unlockedMemoIds)
        if (getCache(cacheKey)?.markers || pendingRef.current.has(cacheKey)) return

        pendingRef.current.add(cacheKey)
        try {
          const res = await getMemosWithLocations(unlockedMemoIds)
          if (res.success) {
            const memos = res.data || []
            const markers = groupMemosByLocation(memos)
            setCache(cacheKey, { markers, memos })
          }
        } catch {
          // Ignore optional data prefetch failures.
        } finally {
          pendingRef.current.delete(cacheKey)
        }
      }
    },
    [getCache, router, setCache, unlockedMemoIds, user?.id]
  )

  const schedulePrefetch = useCallback(
    (href: string) => {
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

  return { prefetchPage, schedulePrefetch, cancelPrefetch }
}
