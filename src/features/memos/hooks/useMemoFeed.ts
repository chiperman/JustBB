'use client';

import { useState, useCallback } from 'react';
import { Memo } from '@/types/memo';
import { getMemos } from '@/actions/memos/query';
import { mergeMemos } from '@/lib/streamUtils';

interface UseMemoFeedProps {
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
}

export function useMemoFeed({ initialMemos, searchParams, adminCode }: UseMemoFeedProps) {
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [hasMoreOlder, setHasMoreOlder] = useState(initialMemos.length >= 20);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchOlderMemos = useCallback(async () => {
        if (isLoadingOlder || !hasMoreOlder) return;

        setIsLoadingOlder(true);
        try {
            const limit = 20;
            // 游标逻辑：使用最旧的非置顶记录
            const unpinnedMemos = memos.filter(m => !m.is_pinned);
            const lastMemo = unpinnedMemos.length > 0 
                ? unpinnedMemos[unpinnedMemos.length - 1] 
                : memos[memos.length - 1];

            const [res] = await Promise.all([
                getMemos({
                    ...searchParams,
                    adminCode,
                    limit,
                    before_date: lastMemo?.created_at,
                    excludePinned: true,
                    sort: "newest",
                }),
                new Promise(resolve => setTimeout(resolve, 1000)) // 仪式感延迟
            ]);

            const nextMemos = res.data || [];
            
            // 边界检查：确保不重复且符合搜索范围
            const validNewMemos = nextMemos.filter(nm => !memos.find(m => m.id === nm.id));

            if (nextMemos.length < limit || validNewMemos.length === 0) {
                setHasMoreOlder(false);
            }

            if (validNewMemos.length > 0) {
                setMemos(prev => mergeMemos(prev, validNewMemos));
            }
        } catch (err) {
            console.error('[Feed Hook] Failed to load older memos:', err);
            setHasMoreOlder(false);
        } finally {
            setIsLoadingOlder(false);
        }
    }, [isLoadingOlder, hasMoreOlder, memos, searchParams, adminCode]);

    const updateMemoInList = useCallback((updatedMemo: Memo) => {
        setMemos(prev => prev.map(m => m.id === updatedMemo.id ? updatedMemo : m));
    }, []);

    return {
        memos,
        isLoadingOlder,
        hasMoreOlder,
        editingId,
        setEditingId,
        fetchOlderMemos,
        updateMemoInList
    };
}
