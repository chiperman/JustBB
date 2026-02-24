'use client';

import { useEffect, useState, memo } from 'react';
import { getAllTags } from '@/actions/tags';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';

import { useTags } from '@/context/TagsContext';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const TagCloud = memo(function TagCloud() {
    const { tags, isLoading, isMounted } = useTags();
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentQuery = searchParams.get('q');

    const topTags = useMemo(() => {
        return [...tags]
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [tags]);

    const handleTagClick = (tag: string) => {
        const params = new URLSearchParams(searchParams);
        if (currentQuery === tag) {
            params.delete('q'); // 再次点击取消过滤
        } else {
            params.set('q', tag);
        }
        router.push(`/?${params.toString()}`);
    };

    return (
        <AnimatePresence mode="wait">
            {(!isMounted && tags.length === 0) || (isLoading && tags.length === 0) ? (
                <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-wrap gap-2"
                >
                    <Skeleton className="h-6 w-12 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-10 rounded-md" />
                    <Skeleton className="h-6 w-14 rounded-md" />
                    <Skeleton className="h-6 w-12 rounded-md" />
                    <Skeleton className="h-6 w-8 rounded-md" />
                </motion.div>
            ) : topTags.length === 0 ? (
                <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="text-xs text-muted-foreground/50 py-2"
                >
                    暂无标签
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-wrap gap-2"
                >
                    {topTags.map(({ tag_name, count }) => {
                        const isActive = currentQuery === tag_name;
                        return (
                            <Badge
                                key={tag_name}
                                variant={isActive ? "default" : "secondary"}
                                onClick={() => handleTagClick(tag_name)}
                                className={cn(
                                    "cursor-pointer px-2 py-1 text-[12px] font-normal gap-1.5 transition-all hover:opacity-80 rounded-md border-none shadow-none",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-stone-100 dark:bg-stone-900 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
                                )}
                                aria-label={`标签 #${tag_name}，共有 ${count} 条记录`}
                            >
                                <span aria-hidden="true">#{tag_name}</span>
                                <span className={cn(
                                    "text-[10px] opacity-60",
                                    isActive ? "text-primary-foreground" : "text-stone-400"
                                )} aria-hidden="true">{count}</span>
                            </Badge>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
});
