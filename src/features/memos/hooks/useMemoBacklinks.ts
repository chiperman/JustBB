'use client';

import { useState, useCallback } from 'react';
import { Memo } from '@/types/memo';

export function useMemoBacklinks(memoNumber: number) {
    const [backlinks, setBacklinks] = useState<Memo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showBacklinks, setShowBacklinks] = useState(false);

    const toggleBacklinks = useCallback(async () => {
        if (!showBacklinks && backlinks.length === 0) {
            setIsLoading(true);
            setShowBacklinks(true); // 立即打开以开始高度动画
            try {
                const { getBacklinks } = await import('@/actions/memos/query');
                const res = await getBacklinks(memoNumber);
                if (res.success) {
                    setBacklinks(res.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch backlinks:', error);
            } finally {
                setIsLoading(false);
            }
        } else {
            setShowBacklinks(prev => !prev);
        }
    }, [showBacklinks, backlinks.length, memoNumber]);

    return {
        backlinks,
        isLoading,
        showBacklinks,
        setShowBacklinks,
        toggleBacklinks
    };
}
