'use client';

import { useState, useRef, useEffect } from 'react';
import { MemoEditor } from "@/components/ui/MemoEditor";
import { MemoFeed } from '@/components/ui/MemoFeed';
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";

interface MainLayoutClientProps {
    memos: Memo[];
    searchParams: any;
    adminCode?: string;
}

export function MainLayoutClient({ memos, searchParams, adminCode }: MainLayoutClientProps) {
    const [isScrolled, setIsScrolled] = useState(false);
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
            <div className="flex-none bg-background/60 backdrop-blur-xl z-30 shadow-none px-4 md:px-10 dark:bg-background/40 transition-all duration-300">
                <div className="max-w-4xl mx-auto w-full pt-10 pb-6">
                    <div className="space-y-4">
                        <FeedHeader />
                        <MemoEditor isCollapsed={isScrolled} />
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
                    />
                    {memos.length === 0 && <MemoCardSkeleton />}
                </div>
            </div>
        </div>
    );
}
