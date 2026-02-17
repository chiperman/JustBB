'use client';

import { useState, useRef, useEffect } from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";
import { MemoEditor } from "@/components/ui/MemoEditor";
import { MemoFeed } from '@/components/ui/MemoFeed';
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";
import { supabase } from '@/lib/supabase';

interface MainLayoutClientProps {
    memos: Memo[];
    searchParams: any;
    adminCode?: string;
}

export function MainLayoutClient({ memos, searchParams, adminCode }: MainLayoutClientProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsAdmin(user?.app_metadata?.role === 'admin');
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setIsAdmin(session?.user?.app_metadata?.role === 'admin');
        });

        return () => subscription.unsubscribe();
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
            <div className={cn(
                "flex-none z-30 px-4 md:px-10 md:pr-[calc(2.5rem+4px)] transition-all duration-300 sticky top-0",
                isScrolled
                    ? "bg-background/80 backdrop-blur-2xl border-b border-border/40 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] pt-6 pb-4"
                    : "bg-background/20 pt-10 pb-6"
            )}>
                <div className="max-w-4xl mx-auto w-full">
                    <div className="space-y-4">
                        <FeedHeader />
                        {isAdmin && <MemoEditor isCollapsed={isScrolled} contextMemos={memos} />}
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
                        isAdmin={isAdmin}
                    />
                    {memos.length === 0 && <MemoCardSkeleton />}
                </div>
            </div>
        </div>
    );
}
