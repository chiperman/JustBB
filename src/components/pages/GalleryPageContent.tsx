'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { Memo } from '@/types/memo';
import { getGalleryMemos } from '@/actions/memos/query';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon as Loader2 } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

interface GalleryPageContentProps {
    memos?: Memo[];
}

export function GalleryPageContent({ memos: initialMemos = [] }: GalleryPageContentProps) {
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialMemos.length >= 20);
    const [offset, setOffset] = useState(initialMemos.length);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Derived state sync
    const [lastInitialMemos, setLastInitialMemos] = useState(initialMemos);
    if (initialMemos !== lastInitialMemos) {
        setLastInitialMemos(initialMemos);
        setMemos(initialMemos);
        setHasMore(initialMemos.length >= 20);
        setOffset(initialMemos.length);
    }

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const [res] = await Promise.all([
                getGalleryMemos(20, offset),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            const nextMemos = res.success ? (res.data || []) : [];

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
            console.error("Failed to load more gallery memos:", err);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, offset]);

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

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-xl mx-auto space-y-12">
                    <section>
                        <header className="mb-10">
                            <h2 className="text-3xl font-bold tracking-tight mb-2 italic text-foreground/80">画廊</h2>
                            <p className="text-muted-foreground text-sm tracking-wide opacity-70 italic whitespace-pre-line">
                                Visual fragments of memory. {"\n"}
                                每一张图片都是凝固的时间锚点。
                            </p>
                        </header>

                        <GalleryGrid memos={memos} />

                        {/* Bottom Sentry/Loader */}
                        <div ref={observerTarget} className="py-12 flex flex-col items-center justify-center min-h-[100px]">
                            {isLoading ? (
                                <div className="flex items-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="flex items-center justify-center"
                                    >
                                        <HugeiconsIcon icon={Loader2} size={24} className="text-muted-foreground/50 transform-gpu will-change-transform" />
                                    </motion.div>
                                    <span className="ml-2 text-xs text-muted-foreground/60 tracking-widest uppercase">Fetching...</span>
                                </div>
                            ) : !hasMore && memos.length > 0 ? (
                                <div className="text-center text-xs text-muted-foreground/30 font-mono tracking-[0.2em] uppercase">
                                    --- End of Collection ---
                                </div>
                            ) : memos.length === 0 && !isLoading ? (
                                <div className="text-center text-muted-foreground/60 py-12">
                                    暂无影像记录
                                </div>
                            ) : null}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
