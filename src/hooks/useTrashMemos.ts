'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { getTrashMemos, emptyTrash } from "@/actions/memos/trash";
import { Memo } from "@/types/memo";
import { usePageDataCache } from "@/context/PageDataCache";
import { useToast } from "@/hooks/use-toast";

export function useTrashMemos() {
    const { getCache, setCache } = usePageDataCache();
    const cached = getCache('/trash');
    
    const [memos, setMemos] = useState<Memo[]>(cached?.memos ?? []);
    const [isLoading, setIsLoading] = useState(!cached);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                const res = await getTrashMemos();
                if (isMounted && res.success) {
                    const result = res.data || [];
                    setMemos(result);
                    setCache('/trash', { memos: result });
                }
            } catch (error) {
                console.error('[Trash Hook] Load failed:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        load();
        
        return () => {
            isMounted = false;
        };
    }, [setCache]);

    const handleEmptyTrash = useCallback(() => {
        startTransition(async () => {
            const result = await emptyTrash();
            if (result.success) {
                toast({
                    title: "回收站已清空",
                    description: "所有记录已永久删除",
                    variant: "destructive",
                });
                setMemos([]);
                setCache('/trash', { memos: [] });
            } else {
                toast({
                    title: "操作失败",
                    description: result.error,
                    variant: "destructive",
                });
            }
        });
    }, [setCache, toast]);

    return {
        memos,
        isLoading,
        isPending,
        handleEmptyTrash
    };
}
