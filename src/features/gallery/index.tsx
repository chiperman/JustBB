"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { GalleryGrid } from "./components/GalleryGrid"
import { GalleryLoadingGrid } from "./components/GalleryLoadingGrid"
import { Memo } from "@/types/memo"
import { getGalleryMemos } from "@/server/actions/memos/query"
import { getGalleryCacheKey } from "@/shared/lib/page-cache-keys"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon as GalleryIcon, Loading03Icon as Loader2 } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ContextPageShell, ContextPageHeader } from "@/shared/layout/ContextPageShell"
import { usePageDataCache } from "@/state/PageDataCache"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { useUser } from "@/state/UserContext"
import { useDelayedLoadingVisibility } from "@/shared/hooks/useDelayedLoadingVisibility"

interface GalleryPageContentProps {
  memos?: Memo[]
}

const EMPTY_MEMOS: Memo[] = []
const INITIAL_PAGE_SIZE = 20
const LOAD_MORE_PAGE_SIZE = 30

export function GalleryPageContent({ memos: initialMemos = EMPTY_MEMOS }: GalleryPageContentProps) {
  const { getCache, setCache } = usePageDataCache()
  const { unlockedMemoIds } = useUnlockedMemos()
  const { user } = useUser()
  const cacheKey = getGalleryCacheKey(user?.id, unlockedMemoIds)
  const cached = getCache(cacheKey)
  const bootMemos = initialMemos.length > 0 ? initialMemos : (cached?.memos as Memo[] | undefined)
  const [memos, setMemos] = useState<Memo[]>(bootMemos ?? EMPTY_MEMOS)
  const [isInitialLoading, setIsInitialLoading] = useState(!bootMemos)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(
    typeof cached?.hasMore === "boolean"
      ? cached.hasMore
      : (bootMemos?.length ?? 0) >= INITIAL_PAGE_SIZE
  )
  const [offset, setOffset] = useState(bootMemos?.length ?? 0)
  const [previousCacheKey, setPreviousCacheKey] = useState(cacheKey)
  const observerTarget = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const showInitialSkeleton = useDelayedLoadingVisibility(isInitialLoading)

  if (cacheKey !== previousCacheKey) {
    const nextCached = getCache(cacheKey)
    const nextMemos = nextCached?.memos as Memo[] | undefined
    setPreviousCacheKey(cacheKey)
    setMemos(nextMemos ?? EMPTY_MEMOS)
    setHasMore(
      typeof nextCached?.hasMore === "boolean"
        ? nextCached.hasMore
        : (nextMemos?.length ?? 0) >= INITIAL_PAGE_SIZE
    )
    setOffset(nextMemos?.length ?? 0)
    setIsInitialLoading(!nextMemos)
    setIsLoadingMore(false)
  }

  useEffect(() => {
    if (initialMemos.length === 0) return

    setMemos(initialMemos)
    setHasMore(initialMemos.length >= INITIAL_PAGE_SIZE)
    setOffset(initialMemos.length)
    setCache(cacheKey, {
      memos: initialMemos,
      hasMore: initialMemos.length >= INITIAL_PAGE_SIZE,
    })
    setIsInitialLoading(false)
  }, [cacheKey, initialMemos, setCache])

  useEffect(() => {
    let cancelled = false

    const loadInitialMemos = async () => {
      const cachedData = getCache(cacheKey)
      const cachedMemos = cachedData?.memos as Memo[] | undefined
      if (cachedMemos) {
        const cachedHasMore = cachedData?.hasMore
        setMemos(cachedMemos)
        setHasMore(
          typeof cachedHasMore === "boolean"
            ? cachedHasMore
            : cachedMemos.length >= INITIAL_PAGE_SIZE
        )
        setOffset(cachedMemos.length)
        setIsInitialLoading(false)
      } else {
        setIsInitialLoading(true)
      }

      try {
        const res = await getGalleryMemos(INITIAL_PAGE_SIZE, 0, unlockedMemoIds)
        const nextMemos = res.success ? res.data || [] : []
        const nextHasMore = nextMemos.length >= INITIAL_PAGE_SIZE

        if (cancelled) return

        setMemos(nextMemos)
        setHasMore(nextHasMore)
        setOffset(nextMemos.length)
        setCache(cacheKey, { memos: nextMemos, hasMore: nextHasMore })
      } catch (err) {
        console.error("Failed to bootstrap gallery memos:", err)
        if (!cancelled) {
          setHasMore(false)
        }
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false)
        }
      }
    }

    void loadInitialMemos()

    return () => {
      cancelled = true
    }
  }, [cacheKey, getCache, setCache, unlockedMemoIds])

  const loadMore = useCallback(async () => {
    if (isInitialLoading || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const res = await getGalleryMemos(LOAD_MORE_PAGE_SIZE, offset, unlockedMemoIds)
      const nextMemos = res.success ? res.data || [] : []
      const nextHasMore = nextMemos.length >= LOAD_MORE_PAGE_SIZE

      if (!nextHasMore) {
        setHasMore(false)
      }

      if (nextMemos.length > 0) {
        setMemos((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const uniqueNew = nextMemos.filter((m) => !existingIds.has(m.id))
          const merged = [...prev, ...uniqueNew]
          setCache(cacheKey, { memos: merged, hasMore: nextHasMore })
          return merged
        })
        setOffset((prev) => prev + nextMemos.length)
      }
    } catch (err) {
      console.error("Failed to load more gallery memos:", err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [cacheKey, hasMore, isInitialLoading, isLoadingMore, offset, setCache, unlockedMemoIds])

  useEffect(() => {
    const target = observerTarget.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isInitialLoading && !isLoadingMore && hasMore) {
          loadMore()
        }
      },
      { threshold: 0, rootMargin: "600px" }
    )

    observer.observe(target)
    return () => observer.unobserve(target)
  }, [loadMore, isInitialLoading, isLoadingMore, hasMore])

  const canShowResolvedContent = !isInitialLoading && !showInitialSkeleton
  const isEmpty = canShowResolvedContent && memos.length === 0
  const hasVisibleMemos = canShowResolvedContent && memos.length > 0
  const transitionDuration = shouldReduceMotion ? 0 : 0.2

  return (
    <ContextPageShell
      scrollable={!isEmpty}
      maxWidthClassName={
        isEmpty ? "max-w-screen-xl h-full flex flex-col min-h-0" : "max-w-screen-xl"
      }
      contentClassName={isEmpty ? "flex-1 h-full min-h-0 pt-4 pb-6 flex flex-col" : undefined}
      header={<ContextPageHeader icon={GalleryIcon} title="画廊" />}
    >
      <div className={isEmpty ? "flex-1 min-h-0" : "space-y-12"}>
        <section className={isEmpty ? "flex h-full min-h-0 flex-col" : undefined}>
          <AnimatePresence mode="wait" initial={false}>
            {showInitialSkeleton ? (
              <motion.div
                key="gallery-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: transitionDuration }}
              >
                <GalleryLoadingGrid />
              </motion.div>
            ) : isInitialLoading ? (
              <div key="gallery-pending" aria-hidden="true">
                <GalleryLoadingGrid visible={false} />
              </div>
            ) : (
              <motion.div
                key={isEmpty ? "gallery-empty" : "gallery-content"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: transitionDuration }}
                className={isEmpty ? "flex h-full min-h-0 flex-col" : undefined}
              >
                <GalleryGrid memos={memos} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Sentry/Loader */}
          {hasVisibleMemos && (
            <div
              ref={observerTarget}
              className="py-12 flex flex-col items-center justify-center min-h-[100px]"
            >
              {isLoadingMore ? (
                <div className="flex items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="flex items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={Loader2}
                      size={24}
                      className="text-muted-foreground/50 transform-gpu will-change-transform"
                    />
                  </motion.div>
                  <span className="ml-2 text-xs text-muted-foreground/60 tracking-widest uppercase">
                    Fetching...
                  </span>
                </div>
              ) : !hasMore ? (
                <div className="text-center text-xs text-muted-foreground/30 font-mono tracking-[0.2em] uppercase">
                  --- End of Collection ---
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </ContextPageShell>
  )
}
