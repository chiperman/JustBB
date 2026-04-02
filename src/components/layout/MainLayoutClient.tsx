'use client';

import React, { useEffect, useState, useCallback } from "react";
import { generateCacheKey } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MemoEditor, MemoFeed } from "@/features/memos";
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";
import { usePageDataCache } from "@/context/PageDataCache";
import { getMemos } from "@/actions/memos/query";
import { useSearchParams } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";
import { useUser } from "@/context/UserContext";

export function MainLayoutClient() {
    const searchParams = useSearchParams();
    const { getCache, setCache } = usePageDataCache();
    const { setViewMode } = useLayout();
    const { isAdmin } = useUser();

    // 1. 初始化数据：优先从缓存中获取，确保 SPA 切换瞬间完成
    const flattenedParams = Object.fromEntries(searchParams?.entries() || []);
    const cacheKey = generateCacheKey(flattenedParams);
    const cachedData = getCache(cacheKey);

    const [memos, setMemos] = useState<Memo[]>(cachedData?.memos || []);
    const [isLoading, setIsLoading] = useState(!cachedData);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 2. 数据加载逻辑 (含 SWR 策略)
    const fetchMemosBatch = useCallback(async (isInitial = true) => {
        if (isInitial) {
            setIsRefreshing(true);
        }

        const params: Record<string, string> = {};
        searchParams?.forEach((value, key) => {
            params[key] = value;
        });

        try {
            const res = await getMemos({ ...params, limit: 20 });
            if (res.success) {
                const fetchedMemos = res.data || [];
                setMemos(fetchedMemos);
                setCache(cacheKey, { memos: fetchedMemos });
            }
        } catch (error) {
            console.error("Fetch memos failed:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [searchParams, cacheKey, setCache]);

    // 3. 路由/搜索变动时，重置并刷新 (核心修复：移除 cachedData 依赖，避免更新缓存导致的死循环)
    useEffect(() => {
        // 直接从缓存快照中获取数据以供瞬时渲染，不订阅其引用变化
        const latestCachedData = getCache(cacheKey);
        
        if (!latestCachedData) {
            setIsLoading(true);
            setMemos([]);
        } else {
            setMemos(latestCachedData.memos || []);
            setIsLoading(false);
        }
        
        // 即使有缓存，也在后台发起 SWR 刷新
        fetchMemosBatch(true);
    }, [cacheKey, fetchMemosBatch, getCache]); // getCache 虽然是 context 方法，但它是稳定的，建议加入依赖项符合规范

    // 4. 强制重置模式 (回到首页视图)
    useEffect(() => {
        setViewMode('CARD_VIEW');
    }, [setViewMode]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-md mx-auto space-y-8">
                    {/* 发布区域 */}
                    {isAdmin && (
                        <div className="mb-12">
                            <MemoEditor mode="create" isCollapsed={true} />
                        </div>
                    )}

                    {/* Feed 标题与过滤显示 */}
                    <FeedHeader isRefreshing={isRefreshing} />

                    {/* 内容展示区 */}
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
                                        initialMemos={memos}
                                        searchParams={Object.fromEntries(searchParams?.entries() || [])}
                                        isAdmin={isAdmin}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
