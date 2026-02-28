'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from 'framer-motion';
import { MemoEditor } from "@/components/ui/MemoEditor";
import { MemoFeed } from '@/components/ui/MemoFeed';
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";
import { useUser } from '@/context/UserContext';
import { useSelection } from '@/context/SelectionContext';
import { usePageDataCache } from '@/context/PageDataCache';
import { useTimeline } from '@/context/TimelineContext';
import { getMemosContext } from '@/actions/fetchMemos';

interface MainLayoutClientProps {
    memos?: Memo[];
    searchParams?: Record<string, string | string[] | undefined>;
    adminCode?: string;
    initialIsAdmin?: boolean;
}

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
    const headerRef = useRef<HTMLDivElement>(null);
    const { getCache, setCache } = usePageDataCache();

    const { teleportDate, setTeleportDate } = useTimeline();
    const [isTeleporting, setIsTeleporting] = useState(false);
    const [isContextMode, setIsContextMode] = useState(!!searchParams.date);

    // 构建动态缓存键
    const cacheKey = useMemo(() => {
        const params = new URLSearchParams();
        const getV = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : (val ?? '');
        const q = getV(searchParams.query);
        const tag = getV(searchParams.tag);
        const year = getV(searchParams.year);
        const month = getV(searchParams.month);
        if (q) params.set('q', q);
        if (tag) params.set('tag', tag);
        if (year) params.set('year', year);
        if (month) params.set('month', month);
        return params.toString() ? `/?${params.toString()}` : '/';
    }, [searchParams.query, searchParams.tag, searchParams.year, searchParams.month]);

    const cached = getCache(cacheKey);
    const [memos, setMemos] = useState<Memo[]>(initialMemos ?? cached?.memos ?? []);
    const [lastInitialMemos, setLastInitialMemos] = useState(initialMemos);

    // 核心：处理传送逻辑
    useEffect(() => {
        if (!teleportDate) return;

        const performTeleport = async () => {
            console.log(`[Main] Teleporting to: ${teleportDate}`);

            // 1. 预设布局：强制折叠编辑器，消除高度变动
            setIsScrolled(true);
            setIsTeleporting(true);
            setIsContextMode(true);

            // 立即清空当前列表，让视觉产生“时空跳跃”的清屏感
            setMemos([]);

            try {
                const data = await getMemosContext({
                    targetDate: teleportDate,
                    adminCode,
                    query: Array.isArray(searchParams.query) ? searchParams.query[0] : (searchParams.query as string),
                    tag: Array.isArray(searchParams.tag) ? searchParams.tag[0] : (searchParams.tag as string),
                });

                await new Promise(r => setTimeout(r, 300));
                setMemos(data);

                // 2. 精准定位补偿
                setTimeout(() => {
                    const container = scrollContainerRef.current;
                    const header = headerRef.current;

                    if (container && header) {
                        // 强制滚动到真正的最初始顶部，因为我们取的就是倒序前 20 条，最上面那条就是我们点击的日期。
                        // 这里稍微往下挪 1 个像素，防止 IntersectionObserver 一落地就判定触顶触发向上加载（导致抓取未来数据）
                        container.scrollTop = 1;
                    }
                    setIsTeleporting(false);
                }, 100);
            } catch (err) {
                console.error("Teleport failed:", err);
                setIsTeleporting(false);
            } finally {
                setTeleportDate(null);
            }
        };

        performTeleport();
    }, [teleportDate, adminCode, searchParams.query, searchParams.tag, setTeleportDate]);

    // 派生状态同步
    const [prevCacheKey, setPrevCacheKey] = useState(cacheKey);
    if (prevCacheKey !== cacheKey) {
        setPrevCacheKey(cacheKey);
        setIsContextMode(false);
        setLastInitialMemos(initialMemos);
        if (initialMemos) setMemos(initialMemos);
        else if (cached) setMemos(cached.memos);
    } else if (initialMemos && initialMemos !== lastInitialMemos) {
        setLastInitialMemos(initialMemos);
        if (!isTeleporting) {
            setMemos(initialMemos);
        }
    }

    const [isLoading, setIsLoading] = useState(!initialMemos && !cached);

    useEffect(() => {
        const critical = JSON.stringify({ q: searchParams.query, t: searchParams.tag, y: searchParams.year, m: searchParams.month });
        if (!initialMemos && !cached) {
            setIsLoading(true);
        }
    }, [searchParams.query, searchParams.tag, searchParams.year, searchParams.month, initialMemos, cached]);

    if (initialMemos) {
        setCache(cacheKey, { memos: initialMemos, searchParams, adminCode, initialIsAdmin });
        if (isLoading) setIsLoading(false);
    }

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const top = scrollContainerRef.current.scrollTop;
            // 只有当不在传送过程中时，才允许滚动条反向控制 setIsScrolled
            if (!isTeleporting) {
                setIsScrolled(top > 100);
            }
        }
    };

    const teleportVariants = {
        initial: { y: 100, opacity: 0, filter: 'blur(10px)' },
        animate: { y: 0, opacity: 1, filter: 'blur(0px)' },
        exit: { y: -100, opacity: 0, filter: 'blur(10px)' }
    };

    const feedKey = useMemo(() => (memos.length > 0 ? memos[0].id : 'empty'), [memos]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-accent/20 relative">
            <div
                ref={headerRef}
                className={cn(
                    "flex-none z-30 px-4 md:px-10 sticky top-0 pt-8 pb-4 transition-all duration-300",
                    isScrolled ? "bg-background/80 backdrop-blur-2xl border-b border-border/40" : "bg-background/0"
                )}
            >
                <div className="max-w-4xl mx-auto w-full">
                    <div className="space-y-4">
                        <FeedHeader />
                        <AnimatePresence mode="wait">
                            {effectiveIsAdmin && (
                                <MemoEditor key="editor" isCollapsed={isScrolled} contextMemos={memos} className={isSelectionMode ? "hidden" : ""} />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto scrollbar-hover p-4 md:px-10 md:pt-0 md:pb-8 scrollbar-stable scroll-smooth"
            >
                <div className="max-w-4xl mx-auto w-full pb-20">
                    {isLoading && !isTeleporting ? (
                        <div className="space-y-6"><MemoCardSkeleton /><MemoCardSkeleton /></div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isTeleporting ? 'teleporting' : feedKey}
                                variants={teleportVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                            >
                                <MemoFeed
                                    initialMemos={memos}
                                    searchParams={searchParams}
                                    adminCode={adminCode}
                                    isAdmin={effectiveIsAdmin}
                                    forceContextMode={isContextMode}
                                />
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isTeleporting && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-background/10 backdrop-blur-sm pointer-events-none">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-1 h-12 bg-primary/40 animate-pulse" />
                            <span className="text-[10px] font-mono tracking-tighter text-primary/60 uppercase">TELEPORTING</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
