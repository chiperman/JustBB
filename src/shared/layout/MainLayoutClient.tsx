"use client"

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react"
import { generateCacheKey, cn } from "@/shared/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { MemoEditor, MemoFeed } from "@/features/memos"
import { FeedHeader } from "@/shared/ui/FeedHeader"
import { MemoCardSkeleton } from "@/shared/ui/MemoCardSkeleton"
import { Memo } from "@/types/memo"
import { usePageDataCache } from "@/state/PageDataCache"
import { getMemos } from "@/server/actions/memos/query"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/state/UserContext"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"

export function MainLayoutClient() {
  const searchParams = useSearchParams()
  const { getCache, setCache } = usePageDataCache()
  const { user } = useUser()
  const { unlockedMemoIds } = useUnlockedMemos()
  const unlockedMemoIdsRef = useRef(unlockedMemoIds)
  useEffect(() => {
    unlockedMemoIdsRef.current = unlockedMemoIds
  }, [unlockedMemoIds])

  // 滚动与吸顶状态管理
  const containerRef = useRef<HTMLDivElement>(null)
  const [editorForceCollapsed, setEditorForceCollapsed] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const lastScrollTop = useRef(0)

  // 监听滚动，实现迟滞触发逻辑 (Hysteresis Logic)
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const syncCollapsedState = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const scrollableHeight = scrollHeight - clientHeight

      // 只有内容足够丰富时 (设计稿阈值: 300px) 才触发收缩
      if (scrollableHeight < 300) {
        setEditorForceCollapsed(false)
        setShowScrollTop(false)
        return
      }

      // 迟滞触发逻辑:
      // 1. 下滑超过 100px 强行收缩
      // 2. 回滚到 50px 以下尝试展开
      if (scrollTop > 100) {
        setEditorForceCollapsed(true)
      } else if (scrollTop < 50) {
        setEditorForceCollapsed(false)
      }

      // 超过 300px 显示“回到顶部”按钮
      setShowScrollTop(scrollTop > 300)

      lastScrollTop.current = scrollTop
    }

    syncCollapsedState()
    container.addEventListener("scroll", syncCollapsedState, { passive: true })
    return () => container.removeEventListener("scroll", syncCollapsedState)
  }, [])

  // 1. 初始化数据：优先从缓存中获取，确保 SPA 切换瞬间完成
  const searchParamsKey = searchParams?.toString() || ""
  const flattenedParams = useMemo(
    () => Object.fromEntries(new URLSearchParams(searchParamsKey).entries()),
    [searchParamsKey]
  )
  const baseCacheKey = generateCacheKey(flattenedParams)
  const viewerScope = user?.id ?? "anonymous"
  const cacheKey = `${baseCacheKey}::viewer=${viewerScope}`
  const cachedData = getCache(cacheKey)
  const latestRequestIdRef = useRef(0)

  const [prevCacheKey, setPrevCacheKey] = useState(cacheKey)
  const [memos, setMemos] = useState<Memo[]>(cachedData?.memos || [])
  const [isLoading, setIsLoading] = useState(!cachedData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 当 cacheKey 变动时，在渲染阶段立即同步调整状态，防止子组件以旧数据渲染
  if (cacheKey !== prevCacheKey) {
    setPrevCacheKey(cacheKey)
    const latestCachedData = getCache(cacheKey)
    if (!latestCachedData) {
      setIsLoading(true)
      setMemos([])
    } else {
      setMemos(latestCachedData.memos || [])
      setIsLoading(false)
    }
  }

  // 2. 路由/搜索变动时重置并刷新，只接受当前 query 的最新结果
  useEffect(() => {
    const latestCachedData = getCache(cacheKey)

    if (!latestCachedData) {
      setIsLoading(true)
      setMemos([])
    } else {
      setMemos(latestCachedData.memos || [])
      setIsLoading(false)
    }

    setIsRefreshing(true)
    const requestId = ++latestRequestIdRef.current
    let cancelled = false

    const refreshMemos = async () => {
      try {
        const res = await getMemos({
          ...flattenedParams,
          limit: 30,
          unlockedMemoIds: unlockedMemoIdsRef.current,
        })

        if (cancelled || latestRequestIdRef.current !== requestId) {
          return
        }

        if (res.success) {
          const fetchedMemos = res.data || []
          setMemos(fetchedMemos)
          setCache(cacheKey, { memos: fetchedMemos })
        }
      } catch (error) {
        if (!cancelled && latestRequestIdRef.current === requestId) {
          console.error("Fetch memos failed:", error)
        }
      } finally {
        if (!cancelled && latestRequestIdRef.current === requestId) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    void refreshMemos()

    return () => {
      cancelled = true
    }
  }, [cacheKey, flattenedParams, getCache, setCache])

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-background">
      {/* 1. 顶部固定区域 (Fixed Top Area) */}
      <div
        className={cn(
          "flex-none z-30 transition-all duration-300 border-b",
          editorForceCollapsed
            ? "bg-background/80 backdrop-blur-md border-border/20"
            : "bg-transparent border-border/0"
        )}
      >
        <div className="max-w-screen-md mx-auto">
          {/* Level 3: Visual Padding Area */}
          <div className="px-6 py-5 flex flex-col">
            {/* Feed 标题与过滤显示 (包含 Logo 和 SearchInput) */}
            <FeedHeader isRefreshing={isRefreshing} />

            {/* 编辑器区域 */}
            <AnimatePresence initial={false}>
              {user && (
                <motion.div
                  key="memo-editor-wrapper"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    marginTop: 0,
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                    marginTop: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                  }}
                  className="overflow-hidden mt-6"
                >
                  <MemoEditor
                    mode="create"
                    isCollapsed={true}
                    scrollCollapsed={editorForceCollapsed}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 2. 底部滚动区域 (Scrollable Feed Area) */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-stable-both">
        <div className="max-w-screen-md mx-auto flex min-h-full flex-col">
          {/* Level 3: Visual Padding Area */}
          <div className="flex flex-1 flex-col px-6 pt-4 pb-20">
            <div className="relative flex min-h-[400px] flex-1 flex-col">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {[1, 2, 3].map((i) => (
                      <MemoCardSkeleton key={i} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="feed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex w-full flex-1 flex-col"
                  >
                    <MemoFeed
                      key={cacheKey}
                      initialMemos={memos}
                      searchParams={flattenedParams}
                      scrollContainerRef={containerRef}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 回到顶部按钮 */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="back-to-top"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }}
            className="absolute bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:text-foreground [@media(pointer:coarse)]:active:scale-95"
            aria-label="回到顶部"
          >
            <HugeiconsIcon icon={ArrowUp01Icon} size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
