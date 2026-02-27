'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { AnimatePresence } from 'framer-motion';
import { MemoEditor } from "@/components/ui/MemoEditor";
import { MemoFeed } from '@/components/ui/MemoFeed';
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";
import { useUser } from '@/context/UserContext';
import { useSelection } from '@/context/SelectionContext';
import { usePageDataCache } from '@/context/PageDataCache';
import { getMemos } from '@/actions/fetchMemos';

interface MainLayoutClientProps {
    memos?: Memo[];
    searchParams?: Record<string, string | string[] | undefined>;
    adminCode?: string;
    initialIsAdmin?: boolean;
}

/**
 * 首页主内容组件
 * 支持两种模式：
 * 1. SSR：从 Server Component 接收 memos
 * 2. SPA：无 memos 时从缓存读取或客户端获取
 */
export function MainLayoutClient({
    memos: initialMemos,
    searchParams = {},
    adminCode,
    initialIsAdmin = false
}: MainLayoutClientProps) {
    const { isAdmin, loading } = useUser();
    const effectiveIsAdmin = loading ? (initialIsAdmin ?? false) : isAdmin;
    const [isScrolled, setIsScrolled] = useState(false);
    const { isSelectionMode } = useSelection();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { getCache, setCache } = usePageDataCache();

    // 构建动态缓存键：基于路径和筛选项，确保不同日期的过滤不互相干扰
    const cacheKey = useMemo(() => {
        const params = new URLSearchParams();
        const getV = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : (val ?? '');

        const q = getV(searchParams.query);
        const tag = getV(searchParams.tag);
        const date = getV(searchParams.date);
        const year = getV(searchParams.year);
        const month = getV(searchParams.month);

        if (q) params.set('q', q);
        if (tag) params.set('tag', tag);
        if (date) params.set('date', date);
        if (year) params.set('year', year);
        if (month) params.set('month', month);
        const qs = params.toString();
        return qs ? `/?${qs}` : '/';
    }, [searchParams]);

    // 数据逻辑：优先初始数据 (SSR)，无初始数据时尝试读缓存 (SPA/回退)
    const cached = getCache(cacheKey);
    const [memos, setMemos] = useState<Memo[]>(initialMemos ?? cached?.memos ?? []);

    // 关键修正：派生状态 (Derived State) 模式
    // 在渲染期间直接检测 props 变化，消除 useEffect 的一帧延迟
    const [prevCacheKey, setPrevCacheKey] = useState(cacheKey);
    if (prevCacheKey !== cacheKey) {
        setPrevCacheKey(cacheKey);
        // 如果 SSR 传来了新数据，直接强制同步
        if (initialMemos) {
            setMemos(initialMemos);
        } else if (cached) {
            setMemos(cached.memos);
        }
    } else if (initialMemos && initialMemos !== memos) {
        // 关键：即使 cacheKey 没变，如果 props 中的 initialMemos 变了（router.refresh() 触发）
        // 也需要同步到本地 state
        setMemos(initialMemos);
    }

    const [isLoading, setIsLoading] = useState(!initialMemos && !cached);

    // 监听 URL 筛选参数变化，立即开启 Loading 反馈 (派生模式)
    const searchParamsStr = JSON.stringify(searchParams);
    const [prevSearchParamsStr, setPrevSearchParamsStr] = useState(searchParamsStr);
    if (prevSearchParamsStr !== searchParamsStr) {
        setPrevSearchParamsStr(searchParamsStr);
        setIsLoading(true);
    }

    // 监听数据到达并更新缓存 (渲染同步模式)
    if (initialMemos) {
        setCache(cacheKey, { memos: initialMemos, searchParams, adminCode, initialIsAdmin });
        if (isLoading) setIsLoading(false);
    }

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollTop = scrollContainerRef.current.scrollTop;
            setIsScrolled(scrollTop > 100);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-accent/20 relative">
            {/* 固定顶部区域 - 品牌、搜索 & 编辑器 */}
            <div
                className={cn(
                    "flex-none z-30 px-4 md:px-10 sticky top-0 pt-8 pb-4 transition-all duration-300 ease-in-out scrollbar-stable overflow-y-auto",
                    isScrolled
                        ? "bg-background/80 backdrop-blur-2xl border-b border-border/40 shadow-sm"
                        : "bg-background/0"
                )}
            >
                <div className="max-w-4xl mx-auto w-full">
                    <div className="space-y-4">
                        <FeedHeader />
                        <AnimatePresence mode="wait">
                            {effectiveIsAdmin && (
                                <MemoEditor
                                    key="memo-editor"
                                    isCollapsed={isScrolled}
                                    contextMemos={memos}
                                    className={isSelectionMode ? "hidden" : ""}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* 滚动内容流区域 */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto scrollbar-hover p-4 md:px-10 md:pt-0 md:pb-8 scrollbar-stable"
            >
                <div className="max-w-4xl mx-auto w-full pb-20">
                    {isLoading ? (
                        <>
                            <MemoCardSkeleton />
                            <MemoCardSkeleton />
                            <MemoCardSkeleton />
                        </>
                    ) : (
                        <>
                            <MemoFeed
                                initialMemos={memos ?? []}
                                searchParams={searchParams}
                                adminCode={adminCode}
                                isAdmin={effectiveIsAdmin}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
