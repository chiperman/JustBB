import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { MemoCardSkeleton } from './MemoCardSkeleton';
import { getMemos, getArchivedMemos } from '@/actions/fetchMemos';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';
import { Memo } from '@/types/memo';
import { useTimeline } from '@/context/TimelineContext';
import { mergeMemos } from '@/lib/streamUtils';

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
}

export function MemoFeed({ initialMemos = [], searchParams, adminCode, isAdmin = false }: MemoFeedProps) {
    // 1. Core State
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [isLoadingNewer, setIsLoadingNewer] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(initialMemos.length >= 20);
    const [hasMoreNewer, setHasMoreNewer] = useState(false); // 默认处于顶端，除非是传送模式
    const [editingId, setEditingId] = useState<string | null>(null);

    const prevParamsRef = useRef(JSON.stringify(searchParams));
    const observerTargetBottom = useRef<HTMLDivElement>(null);
    const observerTargetTop = useRef<HTMLDivElement>(null);
    const feedContainerRef = useRef<HTMLDivElement>(null);

    // 2. 状态同步：当参数变化或初始数据到达
    useEffect(() => {
        const currentParamsStr = JSON.stringify(searchParams);
        const paramsChanged = currentParamsStr !== prevParamsRef.current;

        if (paramsChanged) {
            prevParamsRef.current = currentParamsStr;
            setMemos(initialMemos);
            setHasMoreOlder(initialMemos.length >= 10); // 上下文模式下，单边数据可能较少
            
            // 关键：如果存在日期定位，开启向上加载开关
            if (searchParams.date) {
                setHasMoreNewer(true);
            } else {
                setHasMoreNewer(false);
            }
        } else {
            setMemos(initialMemos);
        }
    }, [searchParams, initialMemos]);

    // 3. 加载逻辑：双向拉取
    const fetchMemosBatch = useCallback(async (direction: 'older' | 'newer') => {
        if (direction === 'older' && (isLoadingOlder || !hasMoreOlder)) return;
        if (direction === 'newer' && (isLoadingNewer || !hasMoreNewer)) return;

        const isOlder = direction === 'older';
        isOlder ? setIsLoadingOlder(true) : setIsLoadingNewer(true);

        try {
            const limit = 20;
            let nextMemos: Memo[] = [];

            if (isOlder) {
                // 向下加载：获取比当前最旧记录更早的
                const lastMemo = memos[memos.length - 1];
                nextMemos = await getMemos({
                    ...searchParams,
                    adminCode,
                    limit,
                    before_date: lastMemo?.created_at,
                    sort: 'newest'
                });
                
                // 去重
                const uniqueNew = nextMemos.filter(nm => !memos.find(m => m.id === nm.id));
                if (uniqueNew.length < limit) setHasMoreOlder(false);
                if (uniqueNew.length > 0) setMemos(prev => mergeMemos(prev, uniqueNew));
            } else {
                // 向上加载：获取比当前最新记录更晚的
                const firstMemo = memos[0];
                nextMemos = await getMemos({
                    ...searchParams,
                    adminCode,
                    limit,
                    after_date: firstMemo?.created_at,
                    sort: 'oldest' // 拿最接近当前窗口的
                });

                const uniqueNew = nextMemos.filter(nm => !memos.find(m => m.id === nm.id));
                if (uniqueNew.length < limit) setHasMoreNewer(false);
                
                if (uniqueNew.length > 0) {
                    // --- 滚动锚定补偿 (Scroll Anchoring) ---
                    // 1. 获取主滚动容器（在 MainLayoutClient 中定义）
                    const scrollContainer = feedContainerRef.current?.closest('.overflow-y-auto');
                    if (scrollContainer) {
                        const previousHeight = scrollContainer.scrollHeight;
                        const previousScrollTop = scrollContainer.scrollTop;

                        // 2. 更新数据
                        setMemos(prev => mergeMemos(prev, uniqueNew));

                        // 3. 在下一帧补偿滚动高度
                        requestAnimationFrame(() => {
                            const newHeight = scrollContainer.scrollHeight;
                            const heightDiff = newHeight - previousHeight;
                            scrollContainer.scrollTop = previousScrollTop + heightDiff;
                        });
                    } else {
                        setMemos(prev => mergeMemos(prev, uniqueNew));
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to load ${direction} memos:`, err);
            isOlder ? setHasMoreOlder(false) : setHasMoreNewer(false);
        } finally {
            isOlder ? setIsLoadingOlder(false) : setIsLoadingNewer(false);
        }
    }, [isLoadingOlder, isLoadingNewer, hasMoreOlder, hasMoreNewer, memos, searchParams, adminCode]);

    // 4. 双向监听
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

        const topObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingNewer && hasMoreNewer) {
                    fetchMemosBatch('newer');
                }
            },
            { threshold: 0.1, rootMargin: '400px' }
        );

        bottomObserver.observe(bottom);
        topObserver.observe(top);
        
        return () => {
            bottomObserver.unobserve(bottom);
            topObserver.unobserve(top);
        };
    }, [fetchMemosBatch, isLoadingOlder, isLoadingNewer, hasMoreOlder, hasMoreNewer]);

    // 5. Scroll Spy (同步侧边栏高亮)
    const { setActiveId, isManualClick } = useTimeline();
    useEffect(() => {
        if (isManualClick || memos.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.filter(e => e.isIntersecting);
                if (intersecting.length > 0) setActiveId(intersecting[0].target.id);
            },
            { rootMargin: '-80px 0px -80% 0px', threshold: 0 }
        );
        const anchors = document.querySelectorAll('div[id^="date-"], div[id^="month-"], div[id^="year-"]');
        anchors.forEach((a) => observer.observe(a));
        return () => observer.disconnect();
    }, [isManualClick, setActiveId, memos]);

    // 6. Animation Variants
    const itemVariants: Variants = {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: {
            opacity: 1, y: 0, scale: 1,
            transition: { type: 'spring', stiffness: 260, damping: 26 }
        },
        exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
    };

    return (
        <div ref={feedContainerRef} className="space-y-6">
            {/* Top Sentry: 向上加载更多 */}
            <div ref={observerTargetTop} className="h-4 w-full invisible" />
            
            {isLoadingNewer && (
                <div className="flex items-center justify-center py-4">
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
                        const isFirstOfMonth = currentMonth !== prevMonth || isFirstOfYear;
                        const isFirstOfDay = currentDate !== prevDateFull;

                        return (
                            <motion.div
                                key={memo.id}
                                id={`memo-${memo.id}`}
                                variants={itemVariants}
                                layout
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="break-inside-avoid relative"
                            >
                                {isFirstOfYear && <div id={`year-${currentYear}`} className="absolute -top-32 invisible" aria-hidden="true" />}
                                {isFirstOfMonth && <div id={`month-${currentYear}-${parseInt(currentMonth)}`} className="absolute -top-32 invisible" aria-hidden="true" />}
                                {isFirstOfDay && <div id={`date-${currentDate}`} className="absolute -top-32 invisible" aria-hidden="true" />}
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

            {/* Bottom Sentry: 向下加载更多 */}
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
