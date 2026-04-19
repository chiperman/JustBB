'use client';

import React, { useEffect, useState, useRef, useMemo } from "react";
import { generateCacheKey, cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MemoEditor, MemoFeed } from "@/features/memos";
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";
import { usePageDataCache } from "@/context/PageDataCache";
import { getMemos } from "@/actions/memos/query";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useUnlockedMemos } from "@/context/UnlockedMemosContext";

export function MainLayoutClient() {
    const searchParams = useSearchParams();
    const { getCache, setCache } = usePageDataCache();
    const { user } = useUser();
    const { unlockedMemoIds } = useUnlockedMemos();

    // 滚动与吸顶状态管理
    const containerRef = useRef<HTMLDivElement>(null);
    const [editorForceCollapsed, setEditorForceCollapsed] = useState(false);
    const lastScrollTop = useRef(0);

    // 监听滚动，实现迟滞触发逻辑 (Hysteresis Logic)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const scrollableHeight = scrollHeight - clientHeight;

            // 只有内容足够丰富时 (设计稿阈值: 300px) 才触发收缩
            if (scrollableHeight < 300) {
                setEditorForceCollapsed(false);
                return;
            }

            // 迟滞触发逻辑: 
            // 1. 下滑超过 100px 强行收缩
            // 2. 回滚到 50px 以下尝试展开
            if (scrollTop > 100) {
                setEditorForceCollapsed(true);
            } else if (scrollTop < 50) {
                setEditorForceCollapsed(false);
            }

            lastScrollTop.current = scrollTop;
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // 1. 初始化数据：优先从缓存中获取，确保 SPA 切换瞬间完成
    const searchParamsKey = searchParams?.toString() || "";
    const flattenedParams = useMemo(
        () => Object.fromEntries(new URLSearchParams(searchParamsKey).entries()),
        [searchParamsKey],
    );
    const baseCacheKey = generateCacheKey(flattenedParams);
    const viewerScope = user?.id ?? 'anonymous';
    const unlockedScope = unlockedMemoIds.join(',');
    const cacheKey = `${baseCacheKey}::viewer=${viewerScope}::unlocked=${unlockedScope}`;
    const cachedData = getCache(cacheKey);
    const latestRequestIdRef = useRef(0);

    const [memos, setMemos] = useState<Memo[]>(cachedData?.memos || []);
    const [isLoading, setIsLoading] = useState(!cachedData);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 2. 路由/搜索变动时重置并刷新，只接受当前 query 的最新结果
    useEffect(() => {
        const latestCachedData = getCache(cacheKey);

        if (!latestCachedData) {
            setIsLoading(true);
            setMemos([]);
        } else {
            setMemos(latestCachedData.memos || []);
            setIsLoading(false);
        }

        setIsRefreshing(true);
        const requestId = ++latestRequestIdRef.current;
        let cancelled = false;

        const refreshMemos = async () => {
            try {
                const res = await getMemos({ ...flattenedParams, limit: 30, unlockedMemoIds });

                if (cancelled || latestRequestIdRef.current !== requestId) {
                    return;
                }

                if (res.success) {
                    const fetchedMemos = res.data || [];
                    setMemos(fetchedMemos);
                    setCache(cacheKey, { memos: fetchedMemos });
                }
            } catch (error) {
                if (!cancelled && latestRequestIdRef.current === requestId) {
                    console.error("Fetch memos failed:", error);
                }
            } finally {
                if (!cancelled && latestRequestIdRef.current === requestId) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        };

        void refreshMemos();

        return () => {
            cancelled = true;
        };
    }, [cacheKey, flattenedParams, getCache, setCache, unlockedMemoIds]);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            {/* 1. 顶部固定区域 (Fixed Top Area) */}
            <div className={cn(
                "flex-none z-30 transition-all duration-300 scrollbar-stable overflow-y-auto",
                editorForceCollapsed ? "bg-background/80 backdrop-blur-md shadow-sm border-b border-border/50" : "bg-transparent"
            )}>
                <div className="max-w-screen-md mx-auto">
                    {/* Level 3: Visual Padding Area */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Feed 标题与过滤显示 (包含 Logo 和 SearchInput) */}
                        <FeedHeader isRefreshing={isRefreshing} />

                        {/* 编辑器区域 */}
                        <AnimatePresence>
                            {user && (
                                <MemoEditor
                                    mode="create"
                                    isCollapsed={true}
                                    scrollCollapsed={editorForceCollapsed}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* 2. 底部滚动区域 (Scrollable Feed Area) */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto scrollbar-stable"
            >
                <div className="max-w-screen-md mx-auto">
                    {/* Level 3: Visual Padding Area */}
                    <div className="px-6 pb-20">
                        <div className="relative min-h-[400px]">
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
                                        className="w-full"
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
        </div>
    );
}
