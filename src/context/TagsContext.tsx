'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { getAllTags as fetchAllTagsAction } from '@/actions/memos/analytics';

export interface TagData {
    tag_name: string;
    count: number;
}

interface TagsContextType {
    tags: TagData[];
    refreshTags: () => Promise<void>;
    isLoading: boolean;
    isMounted: boolean;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export function TagsProvider({
    children,
    initialData = []
}: {
    children: React.ReactNode;
    initialData?: TagData[];
}) {
    const [tags, setTags] = useState<TagData[]>(initialData);
    const [isLoading, setIsLoading] = useState(initialData.length === 0);
    const [isMounted, setIsMounted] = useState(false);

    const refreshTags = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetchAllTagsAction();
            if (res.success && res.data) {
                setTags(res.data);
            }
        } catch (error) {
            console.error('Failed to refresh tags:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        refreshTags();
    }, [refreshTags]);

    const contextValue = useMemo(() => ({ 
        tags, 
        refreshTags, 
        isLoading, 
        isMounted 
    }), [tags, refreshTags, isLoading, isMounted]);

    return (
        <TagsContext.Provider value={contextValue}>
            {children}
        </TagsContext.Provider>
    );
}

export function useTags() {
    const context = useContext(TagsContext);
    if (context === undefined) {
        throw new Error('useTags must be used within a TagsProvider');
    }
    return context;
}
