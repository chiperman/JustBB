import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { getMemos, getArchivedMemos } from '@/actions/fetchMemos';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';
import { Memo } from '@/types/memo';
import { useTimeline } from '@/context/TimelineContext';

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
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialMemos.length >= 20);
    const [offset, setOffset] = useState(initialMemos.length);
    const [editingId, setEditingId] = useState<string | null>(null);

    const prevParamsRef = useRef(JSON.stringify(searchParams));
    const observerTarget = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // 2. Refresh list when searchParams change
    useEffect(() => {
        const currentParamsStr = JSON.stringify(searchParams);
        if (currentParamsStr !== prevParamsRef.current) {
            prevParamsRef.current = currentParamsStr;
            // Reset state
            setMemos(initialMemos);
            setOffset(initialMemos.length);
            setHasMore(initialMemos.length >= 20);
            setIsInitialLoad(true);
        }
    }, [searchParams, initialMemos]);

    // 3. Load More Logic
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            let nextMemos: Memo[] = [];

            // 如果是归档模式（年月过滤）
            if (searchParams.year && searchParams.month) {
                const year = parseInt(searchParams.year);
                const month = parseInt(searchParams.month);
                if (!isNaN(year) && !isNaN(month)) {
                    nextMemos = await getArchivedMemos(year, month, 20, offset);
                }
            } else {
                // 普通模式
                nextMemos = await getMemos({
                    ...searchParams,
                    adminCode,
                    offset,
                    limit: 20
                });
            }

            if (nextMemos.length < 20) {
                setHasMore(false);
            }

            if (nextMemos.length > 0) {
                setMemos(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const uniqueNew = nextMemos.filter(m => !existingIds.has(m.id));
                    return [...prev, ...uniqueNew];
                });
                setOffset(prev => prev + nextMemos.length);
            }
        } catch (err) {
            console.error("Failed to load more memos:", err);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    }, [isLoading, hasMore, offset, searchParams, adminCode]);

    // 4. Intersection Observer for Infinite Scroll
    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && hasMore) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        observer.observe(target);
        return () => observer.unobserve(target);
    }, [loadMore, isLoading, hasMore]);

    // 5. Scroll Spy Logic (Timeline Sync)
    const { setActiveId, isManualClick } = useTimeline();

    useEffect(() => {
        if (isManualClick || memos.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const intersectingEntries = entries.filter(e => e.isIntersecting);
                if (intersectingEntries.length > 0) {
                    const topEntry = intersectingEntries[0];
                    setActiveId(topEntry.target.id);
                }
            },
            {
                rootMargin: '-80px 0px -80% 0px',
                threshold: 0
            }
        );

        const anchors = document.querySelectorAll('div[id^="date-"], div[id^="month-"], div[id^="year-"]');
        anchors.forEach((anchor) => observer.observe(anchor));

        return () => {
            anchors.forEach((anchor) => observer.unobserve(anchor));
            observer.disconnect();
        };
    }, [isManualClick, setActiveId, memos]);

    // 6. Animation Variants
    const containerVariants: Variants = {
        initial: { opacity: 1 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 26
            }
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.2 }
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                variants={containerVariants}
                initial={false}
                animate="animate"
                className="columns-1 gap-6 space-y-6"
            >
                <AnimatePresence mode="sync">
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
                                whileInView="animate"
                                viewport={{ once: true, margin: '200px' }}
                                className="break-inside-avoid relative scroll-mt-4"
                            >
                                {isFirstOfYear && (
                                    <div
                                        id={`year-${currentYear}`}
                                        className="absolute -top-4 invisible"
                                        aria-hidden="true"
                                    />
                                )}
                                {isFirstOfMonth && (
                                    <div
                                        id={`month-${currentYear}-${parseInt(currentMonth)}`}
                                        className="absolute -top-4 invisible"
                                        aria-hidden="true"
                                    />
                                )}
                                {isFirstOfDay && (
                                    <div
                                        id={`date-${currentDate}`}
                                        className="absolute -top-4 invisible"
                                        aria-hidden="true"
                                    />
                                )}
                                <MemoCard
                                    memo={memo}
                                    isAdmin={isAdmin}
                                    isEditing={editingId === memo.id}
                                    onEditChange={(editing) => setEditingId(editing ? memo.id : null)}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Bottom Sentry/Loader */}
            <div ref={observerTarget} className="py-8 flex flex-col items-center justify-center min-h-[100px]">
                {isLoading ? (
                    <div className="flex items-center">
                        <HugeiconsIcon icon={Loader2} size={24} className="animate-spin text-muted-foreground/50" />
                        <span className="ml-2 text-xs text-muted-foreground/60">加载更多...</span>
                    </div>
                ) : !hasMore && memos.length > 0 ? (
                    <div className="text-center text-xs text-muted-foreground/40 font-mono tracking-widest uppercase">
                        --- The End ---
                    </div>
                ) : memos.length === 0 && !isLoading ? (
                    <div className="text-center text-muted-foreground/60 py-12">
                        暂无记录
                    </div>
                ) : null}
            </div>
        </div>
    );
}
