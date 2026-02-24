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
    const prevCacheKeyRef = useRef(cacheKey);
    if (prevCacheKeyRef.current !== cacheKey) {
        prevCacheKeyRef.current = cacheKey;
        // 如果 SSR 传来了新数据，直接强制同步
        if (initialMemos) {
            setMemos(initialMemos);
        } else if (cached) {
            setMemos(cached.memos);
        }
    }

    const [isLoading, setIsLoading] = useState(!initialMemos && !cached);

    // 监听 URL 筛选参数变化，立即开启 Loading 反馈
    const searchParamsStr = JSON.stringify(searchParams);
    const prevSearchParamsRef = useRef(searchParamsStr);

    useEffect(() => {
        if (prevSearchParamsRef.current !== searchParamsStr) {
            setIsLoading(true);
            prevSearchParamsRef.current = searchParamsStr;
        }
    }, [searchParamsStr]);

    // 监听数据到达并更新缓存
    useEffect(() => {
        if (initialMemos) {
            setCache(cacheKey, { memos: initialMemos, searchParams, adminCode, initialIsAdmin });
            setIsLoading(false);
        }
    }, [initialMemos, cacheKey, searchParams, adminCode, initialIsAdmin, setCache]);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollTop = scrollContainerRef.current.scrollTop;
            setIsScrolled(scrollTop > 100);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-accent/20 font-sans relative">
            {/* 全局加载进度条 */}
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/20 z-[100] overflow-hidden">
                    <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite] origin-left w-1/3" />
                </div>
            )}
            <style jsx global>{`
                @keyframes loading {
                    0% { transform: translateX(-100%) scaleX(0.5); }
                    50% { transform: translateX(50%) scaleX(1.5); }
                    100% { transform: translateX(200%) scaleX(0.5); }
                }
            `}</style>
            {/* 固定顶部区域 - 品牌、搜索 & 编辑器 */}
            <div
                className={cn(
                    "flex-none z-30 px-4 md:px-10 md:pr-[calc(2.5rem+4px)] sticky top-0 pt-8 pb-4 transition-all duration-300 ease-in-out",
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
                className="flex-1 overflow-y-auto scrollbar-hover p-4 md:px-10 md:pt-0 md:pb-8"
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
