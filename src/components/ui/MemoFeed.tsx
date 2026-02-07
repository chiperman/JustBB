'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MemoCard } from './MemoCard';
import { getMemos } from '@/actions/fetchMemos';
import { Loader2 } from 'lucide-react';
import { Memo } from '@/types/memo';

interface MemoFeedProps {
    initialMemos: Memo[];
    searchParams: {
        query?: string;
        tag?: string;
        year?: string;
        month?: string;
        date?: string;
        code?: string;
    };
    adminCode?: string;
}

export function MemoFeed({ initialMemos, searchParams, adminCode }: MemoFeedProps) {
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [hasMore, setHasMore] = useState(initialMemos.length >= 20);
    const [loading, setLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(initialMemos.length);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMemos(initialMemos);
        offsetRef.current = initialMemos.length;
        setHasMore(initialMemos.length >= 20);
    }, [initialMemos]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const { query, tag, date } = searchParams;

        const moreMemos = await getMemos({
            query,
            tag,
            date,
            adminCode,
            limit: 20,
            offset: offsetRef.current
        });

        if (moreMemos && moreMemos.length > 0) {
            setMemos((prev) => [...prev, ...moreMemos]);
            offsetRef.current += moreMemos.length;
            if (moreMemos.length < 20) setHasMore(false);
        } else {
            setHasMore(false);
        }
        setLoading(false);
    }, [loading, hasMore, searchParams, adminCode]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [loadMore]);

    return (
        <div className="space-y-6">
            {searchParams.date && (
                <div className="flex items-center justify-between px-1 py-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                            日期: {searchParams.date}
                        </span>
                        <span>的记录</span>
                    </div>
                    <button
                        onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete('date');
                            window.history.pushState({}, '', url.toString());
                            // 触发重新渲染。在 Next.js 中通常使用 router.push， 
                            // 但这里我们是在客户端组件中，且 searchParams 是通过 props 传进来的。
                            // 刷新页面是最简单的方式，或者让父组件处理。
                            window.location.reload();
                        }}
                        className="text-xs text-primary hover:underline"
                    >
                        清除筛选
                    </button>
                </div>
            )}
            <div className="columns-1 gap-4 space-y-4">
                {memos.map((memo, index) => {
                    const currentDate = new Date(memo.created_at).toISOString().split('T')[0];
                    const currentYear = currentDate.split('-')[0];
                    const currentMonth = currentDate.split('-')[1];

                    const prevMemo = index > 0 ? memos[index - 1] : null;
                    const prevDateFull = prevMemo ? new Date(prevMemo.created_at).toISOString().split('T')[0] : null;
                    const prevYear = prevDateFull ? prevDateFull.split('-')[0] : null;
                    const prevMonth = prevDateFull ? prevDateFull.split('-')[1] : null;

                    const isFirstOfYear = currentYear !== prevYear;
                    const isFirstOfMonth = currentMonth !== prevMonth || isFirstOfYear;
                    const isFirstOfDay = currentDate !== prevDateFull;

                    return (
                        <div key={memo.id} className="break-inside-avoid relative animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards" style={{ animationDelay: `${index * 50}ms` }}>
                            {isFirstOfYear && (
                                <div
                                    id={`year-${currentYear}`}
                                    className="absolute -top-24 invisible"
                                    aria-hidden="true"
                                />
                            )}
                            {isFirstOfMonth && (
                                <div
                                    id={`month-${currentYear}-${parseInt(currentMonth)}`}
                                    className="absolute -top-20 invisible"
                                    aria-hidden="true"
                                />
                            )}
                            {isFirstOfDay && (
                                <div
                                    id={`date-${currentDate}`}
                                    className="absolute -top-20 invisible"
                                    aria-hidden="true"
                                />
                            )}
                            <MemoCard memo={memo} />
                        </div>
                    );
                })}
            </div>

            {hasMore && (
                <div ref={observerTarget} className="flex justify-center p-4">
                    {loading && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
                </div>
            )}

            {!hasMore && memos.length > 0 && (
                <div className="text-center text-xs text-muted-foreground pb-8 pt-4">
                    --- The End ---
                </div>
            )}
        </div>
    );
}
