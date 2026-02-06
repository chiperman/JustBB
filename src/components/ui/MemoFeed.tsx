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
        const { query, tag } = searchParams;

        const moreMemos = await getMemos({
            query,
            tag,
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
            <div className="columns-1 gap-4 space-y-4">
                {memos.map((memo) => (
                    <div key={memo.id} className="break-inside-avoid">
                        <MemoCard memo={memo} />
                    </div>
                ))}
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
