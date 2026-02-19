'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { getAllMemos } from '@/actions/search';
import { Loader2 } from 'lucide-react';
import { Memo } from '@/types/memo';
import { useTimeline } from '@/context/TimelineContext';
import { memoCache } from '@/lib/memo-cache';
import { clientFilterMemos } from '@/lib/client-filters';

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

export function MemoFeed({ initialMemos, searchParams, adminCode, isAdmin = false }: MemoFeedProps) {
    // 1. Displayed Memos (What user sees)
    // Initially uses SSR data to ensure fast First Paint
    // Once full data is loaded, it switches to client-filtered data
    const [isFullLoaded, setIsFullLoaded] = useState(false);
    const [allMemos, setAllMemos] = useState<Memo[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

    // 监听网络状态变化
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Initial sync with SSR data
    useEffect(() => {
        if (!isFullLoaded) {
            // Can't replace displayed directly here strictly, 
            // but we rely on derived state below
        }
    }, [initialMemos, isFullLoaded]);

    const router = useRouter();

    // 2. Background Load & Cache Sync
    useEffect(() => {
        const syncData = async () => {
            // A. Try loading from local cache first (Instant)
            // CRITICAL: Merge SSR data (initialMemos) into cache persistency, 
            // BUT do not update state from cache if we already have fresh SSR data.
            // This prevents "SSR (Pinned) -> Cache (Unpinned) -> Network (Pinned)" flash.
            if (initialMemos && initialMemos.length > 0) {
                memoCache.mergeItems(initialMemos);
            }

            // Only fallback to cache for display if we have NO SSR data (e.g. offline/error/empty)
            // Otherwise, trust the SSR data until the background fetch completes.
            const hasSSRData = initialMemos && initialMemos.length > 0;

            if (!hasSSRData && memoCache.getInitialized()) {
                const cached = memoCache.getItems() as unknown as Memo[];
                if (cached.length > 0) {
                    setAllMemos(cached);
                    setIsFullLoaded(true);
                }
            }

            // B. Silent Background Fetch (Revalidate)
            try {
                // Determine if we need to fetch (simple strategy: always fetch to sync latest)
                // In future can use timestamp check
                const freshMemos = await getAllMemos();

                // Merge into Cache
                // Map to CacheItem if needed, but we essentially store Memo[]
                // Casting for now as CacheItem is loose
                memoCache.mergeItems(freshMemos as any[]);

                // Update State
                setAllMemos(memoCache.getItems() as unknown as Memo[]);
                setIsFullLoaded(true);
                memoCache.setFullyLoaded(true);

            } catch (err) {
                console.error("Background memo fetch failed", err);
                // Keep showing SSR data or Cache data if available
            }
        };

        syncData();

        // C. Subscribe to Cache Changes
        const unsubscribe = memoCache.subscribe(() => {
            setAllMemos([...memoCache.getItems()] as unknown as Memo[]);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // 3. Derived State: Apply Filters
    const displayedMemos = useMemo(() => {
        const sourceMemos = (isFullLoaded && allMemos.length > 0) ? allMemos : initialMemos;

        // 当 sourceMemos 与已合并的缓存长度一致时，优先使用 allMemos 以保持状态同步
        const activeMemos = (isFullLoaded && allMemos.length >= sourceMemos.length) ? allMemos : sourceMemos;

        return clientFilterMemos(activeMemos, {
            ...searchParams,
            isAdmin,
            isOnline
        });
    }, [isFullLoaded, allMemos, searchParams, initialMemos, isAdmin, isOnline]);


    const { setActiveId, isManualClick } = useTimeline();

    // Scroll Spy Logic
    useEffect(() => {
        if (isManualClick) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // 查找当前最顶部的可见元素
                const intersectingEntries = entries.filter(e => e.isIntersecting);
                if (intersectingEntries.length > 0) {
                    // 按比例排序或直接取第一个
                    const topEntry = intersectingEntries[0];
                    setActiveId(topEntry.target.id);
                }
            },
            {
                // 检测由于滚动位于视野上半部分（接近顶部）的项目
                rootMargin: '-80px 0px -80% 0px',
                threshold: 0
            }
        );

        // 使用属性选择器查找所有锚点
        const refreshObservers = () => {
            const anchors = document.querySelectorAll('div[id^="date-"], div[id^="month-"], div[id^="year-"]');
            anchors.forEach((anchor) => observer.observe(anchor));
            return anchors;
        };

        const currentAnchors = refreshObservers();

        return () => {
            currentAnchors.forEach((anchor) => observer.unobserve(anchor));
            observer.disconnect();
        };
    }, [isManualClick, setActiveId, displayedMemos]);

    const containerVariants: Variants = {
        initial: { opacity: 1 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03, // Snappy stagger
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
                initial="initial"
                animate="animate"
                className="columns-1 gap-6 space-y-6"
            >
                <AnimatePresence mode="popLayout">
                    {displayedMemos.map((memo, index) => {
                        // 使用与 stats.ts 一致的本地时区逻辑 (UTC+8) 构建日期 ID
                        // 否则 00:00-08:00 的记录会被归到前一天，导致锚点 ID 不匹配
                        const utcDate = new Date(memo.created_at);
                        const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
                        const currentDate = localDate.toISOString().split('T')[0];

                        const currentYear = currentDate.split('-')[0];
                        const currentMonth = currentDate.split('-')[1];

                        const prevMemo = index > 0 ? displayedMemos[index - 1] : null;
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

            {!isFullLoaded && (
                <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-xs text-muted-foreground">Loading full history...</span>
                </div>
            )}

            {isFullLoaded && displayedMemos.length > 0 && (
                <div className="text-center text-xs text-muted-foreground pb-8 pt-4">
                    --- The End ---
                </div>
            )}

            {isFullLoaded && displayedMemos.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    No memos found.
                </div>
            )}
        </div>
    );
}
