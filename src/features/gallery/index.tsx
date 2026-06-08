"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { GalleryGrid } from "./components/GalleryGrid"
import { Memo } from "@/types/memo"
import { getGalleryMemos } from "@/server/actions/memos/query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Image01Icon as GalleryIcon,
  Loading03Icon as Loader2,
} from "@hugeicons/core-free-icons"
import { motion } from "framer-motion"
import {
  ContextPageShell,
  ContextPageHeader,
} from "@/shared/layout/ContextPageShell"

interface GalleryPageContentProps {
  memos?: Memo[]
}

const EMPTY_MEMOS: Memo[] = []
const INITIAL_PAGE_SIZE = 20
const LOAD_MORE_PAGE_SIZE = 30

export function GalleryPageContent({
  memos: initialMemos = EMPTY_MEMOS,
}: GalleryPageContentProps) {
  const [memos, setMemos] = useState<Memo[]>(initialMemos)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(
    initialMemos.length >= INITIAL_PAGE_SIZE
  )
  const [offset, setOffset] = useState(initialMemos.length)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMemos(initialMemos)
    setHasMore(initialMemos.length >= INITIAL_PAGE_SIZE)
    setOffset(initialMemos.length)
    setIsLoading(false)
  }, [initialMemos])

  useEffect(() => {
    if (initialMemos.length > 0) return

    let cancelled = false

    const loadInitialMemos = async () => {
      setIsLoading(true)
      try {
        const res = await getGalleryMemos(INITIAL_PAGE_SIZE, 0)
        const nextMemos = res.success ? res.data || [] : []

        if (cancelled) return

        setMemos(nextMemos)
        setHasMore(nextMemos.length >= INITIAL_PAGE_SIZE)
        setOffset(nextMemos.length)
      } catch (err) {
        console.error("Failed to bootstrap gallery memos:", err)
        if (!cancelled) {
          setHasMore(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialMemos()

    return () => {
      cancelled = true
    }
  }, [initialMemos])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const res = await getGalleryMemos(LOAD_MORE_PAGE_SIZE, offset)
      const nextMemos = res.success ? res.data || [] : []

      if (nextMemos.length < LOAD_MORE_PAGE_SIZE) {
        setHasMore(false)
      }

      if (nextMemos.length > 0) {
        setMemos((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const uniqueNew = nextMemos.filter((m) => !existingIds.has(m.id))
          return [...prev, ...uniqueNew]
        })
        setOffset((prev) => prev + nextMemos.length)
      }
    } catch (err) {
      console.error("Failed to load more gallery memos:", err)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, offset])

  useEffect(() => {
    const target = observerTarget.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMore()
        }
      },
      { threshold: 0, rootMargin: "600px" }
    )

    observer.observe(target)
    return () => observer.unobserve(target)
  }, [loadMore, isLoading, hasMore])

  return (
    <ContextPageShell
      maxWidthClassName="max-w-screen-xl"
      header={<ContextPageHeader icon={GalleryIcon} title="画廊" />}
    >
      <div className="space-y-12">
        <section>
          <GalleryGrid memos={memos} />

          {/* Bottom Sentry/Loader */}
          <div
            ref={observerTarget}
            className="py-12 flex flex-col items-center justify-center min-h-[100px]"
          >
            {isLoading ? (
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
            ) : !hasMore && memos.length > 0 ? (
              <div className="text-center text-xs text-muted-foreground/30 font-mono tracking-[0.2em] uppercase">
                --- End of Collection ---
              </div>
            ) : memos.length === 0 && !isLoading ? (
              <div className="text-center text-muted-foreground/60 py-12">
                暂无影像记录
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </ContextPageShell>
  )
}
