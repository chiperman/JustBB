import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { MemoCardSkeleton } from './MemoCardSkeleton';
import { getMemos } from '@/actions/fetchMemos';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';
import { Memo } from '@/types/memo';
import { useTimeline } from '@/context/TimelineContext';
import { mergeMemos } from '@/lib/streamUtils';
import { useLayoutEffect } from 'react';

interface MemoFeedProps {
    initialMemos: Memo[];
    searchParams: {
        query?: string;
        tag?: string;
        year?: string;
        month?: string;
        date?: string;
        sort?: string;
    };
    adminCode?: string;
    isAdmin?: boolean;
    forceContextMode?: boolean;
}

export function MemoFeed({
    initialMemos = [],
    searchParams,
    adminCode,
    isAdmin = false,
    forceContextMode = false
}: MemoFeedProps) {
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [isLoadingNewer, setIsLoadingNewer] = useState(false);
    // 只有非日期过滤状态下，才允许向上/下加载更多。如果带了 date 参数，这就是一个严格的“单日归档”
    const [hasMoreOlder, setHasMoreOlder] = useState(!searchParams.date && initialMemos.length >= 10);
    const [hasMoreNewer, setHasMoreNewer] = useState(!searchParams.date && forceContextMode);
    const [editingId, setEditingId] = useState<string | null>(null);

    const prevParamsRef = useRef(JSON.stringify(searchParams));
    const prevForceContextModeRef = useRef(forceContextMode);

    const observerTargetBottom = useRef<HTMLDivElement>(null);
    const observerTargetTop = useRef<HTMLDivElement>(null);
    const feedContainerRef = useRef<HTMLDivElement>(null);

    // 记录手动向上加载前的滚动状态
    const scrollPreservationRef = useRef<{ expected: boolean; prevHeight: number; prevScrollTop: number }>({
        expected: false,
        prevHeight: 0,
        prevScrollTop: 0,
    });

    // 1. 外部状态同步
    useEffect(() => {
        const currentParamsStr = JSON.stringify(searchParams);
        const paramsChanged = currentParamsStr !== prevParamsRef.current;
        const forceModeChanged = forceContextMode !== prevForceContextModeRef.current;

        if (paramsChanged || forceModeChanged) {
            console.log(`[Feed] Syncing props. paramsChanged: ${paramsChanged}, forceModeChanged: ${forceModeChanged}`);
            prevParamsRef.current = currentParamsStr;
            prevForceContextModeRef.current = forceContextMode;

            setMemos(initialMemos);
            setHasMoreOlder(!searchParams.date && initialMemos.length >= 10);
            setHasMoreNewer(!searchParams.date && forceContextMode);
        } else if (initialMemos.length > 0 && memos.length === 0) {
            // 处理首次加载
            setMemos(initialMemos);
        }
    }, [searchParams, initialMemos, forceContextMode, memos.length]);

    // 2. 双向抓取逻辑
    const fetchMemosBatch = useCallback(async (direction: 'older' | 'newer') => {
        if (direction === 'older' && (isLoadingOlder || !hasMoreOlder)) return;
        if (direction === 'newer' && (isLoadingNewer || !hasMoreNewer)) return;

        const isOlder = direction === 'older';
        if (isOlder) {
            setIsLoadingOlder(true);
        } else {
            setIsLoadingNewer(true);
        }

        try {
            const limit = 20;
            let nextMemos: Memo[] = [];

            if (isOlder) {
                const lastMemo = memos[memos.length - 1];
                nextMemos = await getMemos({
                    ...searchParams,
                    adminCode,
                    limit,
                    before_date: lastMemo?.created_at,
                    sort: 'newest'
                });

                const uniqueNew = nextMemos.filter(nm => !memos.find(m => m.id === nm.id));
                if (nextMemos.length < limit || uniqueNew.length === 0) {
                    setHasMoreOlder(false);
                }
                if (uniqueNew.length > 0) setMemos(prev => mergeMemos(prev, uniqueNew));
            } else {
                const firstMemo = memos[0];
                nextMemos = await getMemos({
                    ...searchParams,
                    adminCode,
                    limit,
                    after_date: firstMemo?.created_at,
                    sort: 'oldest'
                });

                const uniqueNew = nextMemos.filter(nm => !memos.find(m => m.id === nm.id));

                // 关键判定：如果没抓到数据或不足 limit，或去重后无新数据，彻底关闭向上加载开关
                if (nextMemos.length < limit || uniqueNew.length === 0) {
                    console.log("[Feed] Absolute top reached or duplicate boundary.");
                    setHasMoreNewer(false);
                }

                if (uniqueNew.length > 0) {
                    const scrollContainer = feedContainerRef.current?.closest('.overflow-y-auto');
                    if (scrollContainer) {
                        scrollPreservationRef.current = {
                            expected: true,
                            prevHeight: scrollContainer.scrollHeight,
                            prevScrollTop: scrollContainer.scrollTop
                        };
                    }
                    setMemos(prev => mergeMemos(prev, uniqueNew));
                }
            }
        } catch (err) {
            console.error(`[Feed] Failed to load ${direction}:`, err);
            if (isOlder) {
                setHasMoreOlder(false);
            } else {
                setHasMoreNewer(false);
            }
        } finally {
            if (isOlder) {
                setIsLoadingOlder(false);
            } else {
                setIsLoadingNewer(false);
            }
        }
    }, [isLoadingOlder, isLoadingNewer, hasMoreOlder, hasMoreNewer, memos, searchParams, adminCode]);

    // 绘制前微任务：向上加载后瞬间修复高度差，实现“视觉定轴”
    useLayoutEffect(() => {
        if (scrollPreservationRef.current.expected) {
            const scrollContainer = feedContainerRef.current?.closest('.overflow-y-auto');
            if (scrollContainer) {
                const currentHeight = scrollContainer.scrollHeight;
                const heightDiff = currentHeight - scrollPreservationRef.current.prevHeight;

                scrollContainer.scrollTop = scrollPreservationRef.current.prevScrollTop + heightDiff;
            }
            scrollPreservationRef.current.expected = false;
        }
    }, [memos]);

    // 3. 监听哨兵
    useEffect(() => {
        const bottom = observerTargetBottom.current;
        const top = observerTargetTop.current;
        if (!bottom || !top) return;

        const bottomObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingOlder && hasMoreOlder) {
                    fetchMemosBatch('older');
                }
            },
            { threshold: 0.1, rootMargin: '400px' }
        );

        bottomObserver.observe(bottom);

        return () => {
            bottomObserver.disconnect();
        };
    }, [fetchMemosBatch, isLoadingOlder, isLoadingNewer, hasMoreOlder, hasMoreNewer]);

    // 4. Scroll Spy
    const { setActiveId, isManualClick } = useTimeline();
    useEffect(() => {
        if (isManualClick || memos.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.filter(e => e.isIntersecting);
                if (intersecting.length > 0) {
                    setActiveId(intersecting[0].target.id);
                }
            },
            { rootMargin: '-80px 0px -80% 0px', threshold: 0 }
        );
        const anchors = document.querySelectorAll('div[id^="date-"], div[id^="month-"], div[id^="year-"]');
        anchors.forEach((a) => observer.observe(a));
        return () => observer.disconnect();
    }, [isManualClick, setActiveId, memos.length]);

    // 我们去除了 scale 和 y 的物理位移，仅保留透明度渐显
    // 这样能确保刚插入 DOM 时，它的物理高度 100% 确定，scrollAnchor 补偿才能一击命中。
    const itemVariants: Variants = {
        initial: { opacity: 0 },
        animate: (custom: number) => ({
            opacity: 1,
            transition: {
                duration: 0.3,
                delay: custom * 0.05
            }
        }),
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    return (
        <div ref={feedContainerRef} className="space-y-6">
            <div ref={observerTargetTop} className="h-1 w-full invisible" />

            {hasMoreNewer && !isLoadingNewer && memos.length > 0 && (
                <div className="flex justify-center -mt-2 pb-4">
                    <button
                        onClick={() => fetchMemosBatch('newer')}
                        className="px-4 py-1.5 text-xs font-medium text-muted-foreground/60 bg-muted/30 hover:bg-muted hover:text-foreground rounded-full transition-colors font-mono tracking-tight"
                    >
                        Click to load newer memos
                    </button>
                </div>
            )}

            {isLoadingNewer && (
                <div className="flex items-center justify-center py-4 -mt-2">
                    <HugeiconsIcon icon={Loader2} size={20} className="animate-spin text-primary/40" />
                </div>
            )}

            <motion.div initial={false} className="columns-1 gap-6 space-y-6">
                <AnimatePresence mode="popLayout">
                    {memos.map((memo, index) => {
                        const utcDate = new Date(memo.created_at);
                        const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
                        const currentDate = localDate.toISOString().split('T')[0];
                        const currentYear = currentDate.split('-')[0];
                        const currentMonth = currentDate.split('-')[1];

                        const prevMemo = index > 0 ? memos[index - 1] : null;
                        let prevDateFull = null;
                        if (prevMemo) {
                            const prevUtcDate = new Date(prevMemo.created_at);
                            const prevLocalDate = new Date(prevUtcDate.getTime() + 8 * 60 * 60 * 1000);
                            prevDateFull = prevLocalDate.toISOString().split('T')[0];
                        }

                        const prevYear = prevDateFull ? prevDateFull.split('-')[0] : null;
                        const prevMonth = prevDateFull ? prevDateFull.split('-')[1] : null;

                        const isFirstOfYear = currentYear !== prevYear;
                        const isFirstOfMonth = (currentMonth !== prevMonth || isFirstOfYear) && prevDateFull !== null;
                        const isFirstOfDay = currentDate !== prevDateFull;

                        return (
                            <motion.div
                                key={memo.id}
                                id={`memo-${memo.id}`}
                                variants={itemVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                custom={index % 20}
                                className="break-inside-avoid relative"
                            >
                                {isFirstOfYear && <div id={`year-${currentYear}`} className="absolute top-0 invisible" aria-hidden="true" />}
                                {isFirstOfMonth && <div id={`month-${currentYear}-${parseInt(currentMonth)}`} className="absolute top-0 invisible" aria-hidden="true" />}
                                {isFirstOfDay && <div id={`date-${currentDate}`} className="absolute top-0 invisible" aria-hidden="true" />}
                                <MemoCard
                                    memo={memo}
                                    isAdmin={isAdmin}
                                    isEditing={editingId === memo.id}
                                    onEditChange={(editing, updatedMemo) => {
                                        if (!editing && updatedMemo) {
                                            setMemos(prev => prev.map(m => m.id === updatedMemo.id ? updatedMemo : m));
                                        }
                                        setEditingId(editing ? memo.id : null);
                                    }}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            <div ref={observerTargetBottom} className="py-8 flex flex-col items-center justify-center min-h-[100px]">
                {isLoadingOlder ? (
                    <div className="flex items-center">
                        <HugeiconsIcon icon={Loader2} size={24} className="animate-spin text-muted-foreground/50" />
                        <span className="ml-2 text-xs text-muted-foreground/60">加载更多...</span>
                    </div>
                ) : !hasMoreOlder && memos.length > 0 ? (
                    <div className="text-center text-xs text-muted-foreground/40 font-mono tracking-widest uppercase">
                        --- The End ---
                    </div>
                ) : memos.length === 0 && !isLoadingOlder ? (
                    <div className="w-full">
                        <MemoCardSkeleton isEmpty={true} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
