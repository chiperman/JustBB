'use client';

import { useState, useRef, useEffect } from 'react';
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

    // 数据逻辑：初始 > 缓存 > 客户端获取
    const cached = getCache('/');
    const [memos, setMemos] = useState<Memo[]>(initialMemos ?? cached?.memos ?? []);
    const [isLoading, setIsLoading] = useState(!initialMemos && !cached);

    useEffect(() => {
        if (initialMemos) {
            setCache('/', { memos: initialMemos, searchParams, adminCode, initialIsAdmin });
            return;
        }
        // stale-while-revalidate：缓存命中也后台刷新
        let cancelled = false;
        (async () => {
            const result = await getMemos({ limit: 20, sort: 'newest' });
            if (!cancelled) {
                const data = result || [];
                setMemos(data);
                setCache('/', { memos: data, searchParams: {}, adminCode: undefined, initialIsAdmin: false });
                setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollTop = scrollContainerRef.current.scrollTop;
            setIsScrolled(scrollTop > 20);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-accent/20 font-sans">
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
                            {memos.length === 0 && <MemoCardSkeleton />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
