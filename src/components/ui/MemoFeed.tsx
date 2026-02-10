'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MemoCard } from './MemoCard';
import { getMemos } from '@/actions/fetchMemos';
import { Loader2 } from 'lucide-react';
import { Memo } from '@/types/memo';
import { ChevronDown, CheckCircle, ArrowUpDown } from 'lucide-react';
import { useTimeline } from '@/context/TimelineContext';

interface MemoFeedProps {
    initialMemos: Memo[];
    searchParams: {
        query?: string;
        tag?: string;
        year?: string;
        month?: string;
        date?: string;
        code?: string;
        sort?: string;
    };
    adminCode?: string;
}

export function MemoFeed({ initialMemos, searchParams, adminCode }: MemoFeedProps) {
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(initialMemos.length >= 20);
    const [loading, setLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(initialMemos.length);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMemos(initialMemos);
        offsetRef.current = initialMemos.length;
        setHasMore(initialMemos.length >= 20);
    }, [initialMemos]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const { query, tag, date, sort } = searchParams;

        const moreMemos = await getMemos({
            query,
            tag,
            date,
            sort,
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

    const { setActiveId, isManualClick } = useTimeline();

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
    }, [isManualClick, setActiveId, memos]); // memos 即使变化，ID 也是稳定的，但新加载的需要被观察

    return (
        <div className="space-y-6">
            <div className="columns-1 gap-6 space-y-6">
                {memos.map((memo, index) => {
                    // 使用与 stats.ts 一致的本地时区逻辑 (UTC+8) 构建日期 ID
                    // 否则 00:00-08:00 的记录会被归到前一天，导致锚点 ID 不匹配
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
                        <div key={memo.id} id={`memo-${memo.id}`} className="break-inside-avoid relative animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards scroll-mt-4" style={{ animationDelay: `${index * 50}ms` }}>
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
                                isEditing={editingId === memo.id}
                                onEditChange={(editing) => setEditingId(editing ? memo.id : null)}
                            />
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
