'use client';

import { useEffect, useState } from 'react';
import { getAllTags } from '@/actions/tags';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react';

export function TagCloud() {
    const [tags, setTags] = useState<{ tag_name: string; count: number }[]>([]);
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentQuery = searchParams.get('q');

    useEffect(() => {
        getAllTags().then(setTags);
    }, []);

    const handleTagClick = (tag: string) => {
        const params = new URLSearchParams(searchParams);
        if (currentQuery === tag) {
            params.delete('q'); // 再次点击取消过滤
        } else {
            params.set('q', tag);
        }
        router.push(`/?${params.toString()}`);
    };

    if (tags.length === 0) {
        return (
            <div className="h-24 bg-muted/20 rounded-lg border border-border dashed flex items-center justify-center">
                <div className="text-center">
                    <Tag className="w-4 h-4 text-muted-foreground mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] text-muted-foreground">暂无标签</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map(({ tag_name, count }) => {
                const isActive = currentQuery === tag_name;
                return (
                    <button
                        key={tag_name}
                        onClick={() => handleTagClick(tag_name)}
                        className={cn(
                            "text-xs px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20",
                            isActive
                                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        aria-label={`标签 #${tag_name}，共有 ${count} 条记录`}
                        aria-pressed={isActive}
                    >
                        <span aria-hidden="true">#{tag_name}</span>
                        <span className={cn(
                            "text-[10px]",
                            isActive ? "text-primary-foreground/80" : "text-muted-foreground/60"
                        )} aria-hidden="true">{count}</span>
                    </button>
                );
            })}
        </div>
    );
}
