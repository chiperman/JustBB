'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Memo } from '@/types/memo';
import { getMemos } from '@/actions/memos/query';
import { mergeMemos } from '@/lib/streamUtils';
import { useMemoSync, MemoEventPayload } from '@/lib/memos/events';
import { useUnlockedMemos } from '@/context/UnlockedMemosContext';

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
}

const INITIAL_MEMO_PAGE_SIZE = 30;

export function reconcileInitialMemoWindow(
    currentMemos: Memo[],
    previousInitialIds: Set<string>,
    nextInitialMemos: Memo[],
) {
    const olderMemos = currentMemos.filter(memo => !previousInitialIds.has(memo.id));
    return mergeMemos(olderMemos, nextInitialMemos);
}

export function reconcileHasMoreOlder(currentHasMoreOlder: boolean, nextInitialMemos: Memo[]) {
    return currentHasMoreOlder && nextInitialMemos.length >= INITIAL_MEMO_PAGE_SIZE;
}

export function reconcileUpdatedMemo(existingMemo: Memo, updatedMemo: Memo): Memo {
    return {
        ...existingMemo,
        ...updatedMemo,
        is_owner: updatedMemo.is_owner ?? existingMemo.is_owner,
        is_locked: updatedMemo.is_locked ?? existingMemo.is_locked,
    };
}

export function useMemoFeed({ initialMemos, searchParams }: UseMemoFeedProps) {
    const { unlockedMemoIds } = useUnlockedMemos();
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [hasMoreOlder, setHasMoreOlder] = useState(initialMemos.length >= INITIAL_MEMO_PAGE_SIZE);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
    const previousInitialIdsRef = useRef(new Set(initialMemos.map(memo => memo.id)));

    useEffect(() => {
        setMemos(prev => reconcileInitialMemoWindow(prev, previousInitialIdsRef.current, initialMemos));
        setHasMoreOlder(prev => reconcileHasMoreOlder(prev, initialMemos));
        previousInitialIdsRef.current = new Set(initialMemos.map(memo => memo.id));
    }, [initialMemos]);

    const fetchOlderMemos = useCallback(async () => {
        if (isLoadingOlder || !hasMoreOlder) return;

        setIsLoadingOlder(true);
        try {
            const limit = INITIAL_MEMO_PAGE_SIZE;
            const unpinnedMemos = memos.filter(m => !m.is_pinned);
            const lastMemo = unpinnedMemos.length > 0 
                ? unpinnedMemos[unpinnedMemos.length - 1] 
                : memos[memos.length - 1];

                const res = await getMemos({
                    ...searchParams,
                    limit,
                    before_date: lastMemo?.created_at,
                    excludePinned: true,
                    sort: "newest",
                    unlockedMemoIds,
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
    }, [isLoadingOlder, hasMoreOlder, memos, searchParams, unlockedMemoIds]);

    const updateMemoInList = useCallback((updatedMemo: Memo) => {
        setMemos(prev => prev.map(m => m.id === updatedMemo.id ? reconcileUpdatedMemo(m, updatedMemo) : m));
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
