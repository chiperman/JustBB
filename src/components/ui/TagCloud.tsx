'use client';

import { useEffect, useState, memo } from 'react';
import { getAllTags } from '@/actions/tags';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const TagCloud = memo(function TagCloud() {
    const [tags, setTags] = useState<{ tag_name: string; count: number }[]>([]);
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentQuery = searchParams.get('q');

    useEffect(() => {
        getAllTags().then((data) => {
            const sortedTags = [...data]
                .sort((a, b) => b.count - a.count)
                .slice(0, 6);
            setTags(sortedTags);
        });
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
            <div className="text-xs text-muted-foreground/50 py-2">
                暂无标签
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map(({ tag_name, count }) => {
                const isActive = currentQuery === tag_name;
                return (
                    <Badge
                        key={tag_name}
                        variant={isActive ? "default" : "secondary"}
                        onClick={() => handleTagClick(tag_name)}
                        className={cn(
                            "cursor-pointer px-2 py-1 text-xs gap-1.5 transition-all hover:opacity-80",
                            !isActive && "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground font-normal"
                        )}
                        aria-label={`标签 #${tag_name}，共有 ${count} 条记录`}
                    >
                        <span aria-hidden="true">#{tag_name}</span>
                        <span className={cn(
                            "text-[10px]",
                            isActive ? "text-primary-foreground/80" : "text-muted-foreground/60"
                        )} aria-hidden="true">{count}</span>
                    </Badge>
                );
            })}
        </div>
    );
});
