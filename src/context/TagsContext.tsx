'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAllTags as fetchAllTagsAction } from '@/actions/tags';

interface TagData {
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
            const data = await fetchAllTagsAction();
            setTags(data);
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

    return (
        <TagsContext.Provider value={{ tags, refreshTags, isLoading, isMounted }}>
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
