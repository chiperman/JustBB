'use client';

import { useState, useRef } from 'react';
import { cn } from "@/lib/utils";
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { MemoEditor } from "@/components/ui/MemoEditor";
import { MemoFeed } from '@/components/ui/MemoFeed';
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";
import { useUser } from '@/context/UserContext';
import { useSelection } from '@/context/SelectionContext';

interface MainLayoutClientProps {
    memos: Memo[];
    searchParams: any;
    adminCode?: string;
    initialIsAdmin?: boolean;
}

export function MainLayoutClient({ memos, searchParams, adminCode, initialIsAdmin = false }: MainLayoutClientProps) {
    const { isAdmin, loading } = useUser();
    // Prevent flash of "not admin" state during hydration by using initialIsAdmin while loading
    const effectiveIsAdmin = loading ? (initialIsAdmin ?? false) : isAdmin;
    const [isScrolled, setIsScrolled] = useState(false);
    const { isSelectionMode } = useSelection();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollTop = scrollContainerRef.current.scrollTop;
            setIsScrolled(scrollTop > 20);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-accent/20 font-sans">
            {/* 固定顶部区域 - 品牌、搜索 & 编辑器 */}
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
                            {effectiveIsAdmin && !isSelectionMode && (
                                <MemoEditor key="memo-editor" isCollapsed={isScrolled} contextMemos={memos} />
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
                    <MemoFeed
                        initialMemos={memos ?? []}
                        searchParams={searchParams}
                        adminCode={adminCode}
                        isAdmin={effectiveIsAdmin}
                    />
                    {memos.length === 0 && <MemoCardSkeleton />}
                </div>
            </div>
        </div>
    );
}
