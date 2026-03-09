'use client';

import { useEffect, useRef } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { MemoCard } from "./MemoCard";
import { Memo } from "@/types/memo";

// Custom Hooks
import { useMemoFeed } from "@/hooks/useMemoFeed";
import { useFeedScrollSpy } from "@/hooks/useFeedScrollSpy";

// Sub-components
import { FeedItemWrapper } from "./memo-feed/FeedItemWrapper";
import { FeedStatus } from "./memo-feed/FeedStatus";

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

const itemVariants: Variants = {
    initial: { opacity: 0, y: -10 },
    animate: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, delay: custom * 0.05 },
    }),
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

export function MemoFeed({
    initialMemos = [],
    searchParams,
    adminCode,
    isAdmin = false,
}: MemoFeedProps) {
    const observerTargetBottom = useRef<HTMLDivElement>(null);

    const {
        memos,
        isLoadingOlder,
        hasMoreOlder,
        editingId,
        setEditingId,
        fetchOlderMemos,
        updateMemoInList
    } = useMemoFeed({ initialMemos, searchParams, adminCode });

    // 1. 无限滚动监听
    useEffect(() => {
        const bottom = observerTargetBottom.current;
        if (!bottom) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingOlder && hasMoreOlder) {
                    fetchOlderMemos();
                }
            },
            { rootMargin: "0px 0px 1200px 0px", threshold: 0 },
        );
        
        observer.observe(bottom);
        return () => observer.disconnect();
    }, [fetchOlderMemos, isLoadingOlder, hasMoreOlder]);

    // 2. Scroll Spy 同步
    useFeedScrollSpy(memos.length);

    return (
        <div className="space-y-6">
            <motion.div initial={false} className="columns-1 gap-6 space-y-6">
                <AnimatePresence mode="popLayout">
                    {memos.map((memo, index) => (
                        <FeedItemWrapper
                            key={memo.id}
                            memo={memo}
                            index={index}
                            prevMemo={index > 0 ? memos[index - 1] : undefined}
                            variants={itemVariants}
                        >
                            <MemoCard
                                memo={memo}
                                isAdmin={isAdmin}
                                isEditing={editingId === memo.id}
                                onEditChange={(editing, updatedMemo) => {
                                    if (!editing && updatedMemo) updateMemoInList(updatedMemo);
                                    setEditingId(editing ? memo.id : null);
                                }}
                            />
                        </FeedItemWrapper>
                    ))}
                </AnimatePresence>
            </motion.div>

            <div ref={observerTargetBottom}>
                <FeedStatus 
                    isLoadingOlder={isLoadingOlder} 
                    hasMoreOlder={hasMoreOlder} 
                    memosCount={memos.length} 
                />
            </div>
        </div>
    );
}
