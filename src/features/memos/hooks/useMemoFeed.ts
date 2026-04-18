'use client';

import { useState, useCallback, useEffect } from 'react';
import { Memo } from '@/types/memo';
import { getMemos } from '@/actions/memos/query';
import { mergeMemos } from '@/lib/streamUtils';
import { useMemoSync, MemoEventPayload } from '@/lib/memos/events';

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
    const [hasMoreOlder, setHasMoreOlder] = useState(initialMemos.length >= 30);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

    useEffect(() => {
        setMemos(initialMemos);
        setHasMoreOlder(initialMemos.length >= 30);
        setIsLoadingOlder(false);
        setEditingId(null);
        setLastCreatedId(null);
    }, [initialMemos]);

    const fetchOlderMemos = useCallback(async () => {
        if (isLoadingOlder || !hasMoreOlder) return;

        setIsLoadingOlder(true);
        try {
            const limit = 30;
            const unpinnedMemos = memos.filter(m => !m.is_pinned);
            const lastMemo = unpinnedMemos.length > 0 
                ? unpinnedMemos[unpinnedMemos.length - 1] 
                : memos[memos.length - 1];

            const res = await getMemos({
                ...searchParams,
                adminCode,
                limit,
                before_date: lastMemo?.created_at,
                excludePinned: true,
                sort: "newest",
            });

            const nextMemos = res.data || [];
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

    const clearLastCreatedId = useCallback(() => {
        setLastCreatedId(null);
    }, []);

    useMemoSync(useCallback((payload: MemoEventPayload) => {
        setMemos(prev => {
            switch (payload.type) {
                case 'create':
                    if (prev.some(m => m.id === payload.memo.id)) return prev;
                    setLastCreatedId(payload.memo.id);
                    return mergeMemos(prev, [payload.memo]);
                case 'update':
                    return prev.map(m => m.id === payload.id ? { ...m, ...payload.updates } : m);
                case 'delete':
                    return prev.filter(m => m.id !== payload.id);
                default:
                    return prev;
            }
        });
    }, []));

    return {
        memos,
        isLoadingOlder,
        hasMoreOlder,
        editingId,
        setEditingId,
        fetchOlderMemos,
        updateMemoInList,
        lastCreatedId,
        clearLastCreatedId
    };
}
