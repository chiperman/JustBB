'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePageDataCache } from '@/context/PageDataCache';
import { getAllTags } from '@/actions/memos/analytics';

export interface TagData {
    tag_name: string;
    count: number;
}

export function useTagGroups(initialTags?: TagData[]) {
    const { getCache, setCache } = usePageDataCache();
    const cached = getCache('/tags');
    const [tags, setTags] = useState<TagData[]>(initialTags ?? cached?.tags ?? []);
    const [isLoading, setIsLoading] = useState(!initialTags && !cached);

    useEffect(() => {
        if (initialTags) {
            setCache('/tags', { tags: initialTags });
            return;
        }
        let cancelled = false;
        (async () => {
            const res = await getAllTags();
            if (!cancelled) {
                const result = res.success ? (res.data || []) : [];
                setTags(result);
                setCache('/tags', { tags: result });
                setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [initialTags, setCache]);

    const { groupedTags, groups } = useMemo(() => {
        const grouped = tags.reduce((acc, tag) => {
            const firstChar = tag.tag_name.charAt(0).toUpperCase();
            const group = /^[A-Z]$/.test(firstChar) ? firstChar : "#";
            if (!acc[group]) acc[group] = [];
            acc[group].push(tag);
            return acc;
        }, {} as Record<string, TagData[]>);

        const sortedGroups = Object.keys(grouped).sort((a, b) => {
            if (a === "#") return 1;
            if (b === "#") return -1;
            return a.localeCompare(b);
        });

        return { groupedTags: grouped, groups: sortedGroups };
    }, [tags]);

    return { tags, groupedTags, groups, isLoading };
}
