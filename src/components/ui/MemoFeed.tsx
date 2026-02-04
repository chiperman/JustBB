'use client';

import { useState, useEffect, useRef } from 'react';
import { MemoCard } from './MemoCard';
import { getMemos } from '@/actions/fetchMemos';
import { Loader2 } from 'lucide-react';

interface MemoFeedProps {
    initialMemos: any[];
    searchParams: {
        query?: string;
        tag?: string;
        year?: string;
        month?: string;
        code?: string; // admin code passed via params if any
    };
    adminCode?: string; // or passed directly
}

export function MemoFeed({ initialMemos, searchParams, adminCode }: MemoFeedProps) {
    const [memos, setMemos] = useState(initialMemos);
    const [hasMore, setHasMore] = useState(initialMemos.length >= 20); // Assuming limit is 20
    const [loading, setLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(initialMemos.length);

    // Reset when search params change/initialMemos change (e.g. searching)
    useEffect(() => {
        setMemos(initialMemos);
        offsetRef.current = initialMemos.length;
        setHasMore(initialMemos.length >= 20);
    }, [initialMemos]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            async (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    await loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [hasMore, loading, searchParams, adminCode]);

    const loadMore = async () => {
        setLoading(true);
        // Note: actions/fetchMemos.ts getMemos signature:
        // params: { query, adminCode, limit, offset, tag }
        // We need to match this.
        // Also handle year/month filtering? 
        // fetchMemos.ts `getMemos` only handles query/tag/adminCode.
        // It does NOT handle year/month. `getArchivedMemos` does.
        // If we are in archive view (query params year/month), we can't use `getMemos` easily for paging 
        // unless `getArchivedMemos` supports offset/limit.
        // Currently `getArchivedMemos` returns ALL memos for that month (no limit).
        // So infinite scroll might be weird there if the month has huge data, but usually it's okay.
        // If has year/month, we assume it's all loaded (or we need to paginate `getArchivedMemos`).
        // For now, if year/month is present, disable infinite scroll (setHasMore(false)).

        if (searchParams.year && searchParams.month) {
            setHasMore(false);
            setLoading(false);
            return;
        }

        const moreMemos = await getMemos({
            query: searchParams.query,
            tag: searchParams.tag,
            adminCode: adminCode,
            limit: 20,
            offset: offsetRef.current
        });

        if (moreMemos && moreMemos.length > 0) {
            setMemos((prev: any[]) => [...prev, ...moreMemos]);
            offsetRef.current += moreMemos.length;
            if (moreMemos.length < 20) setHasMore(false);
        } else {
            setHasMore(false);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="columns-1 md:columns-2 gap-4 space-y-4">
                {memos.map((memo: any) => (
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
