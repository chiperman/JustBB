'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tag01Icon as TagIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TagData } from '@/hooks/useTagGroups';

export function TagCard({ tag }: { tag: TagData }) {
    return (
        <Link
            href={`/?q=${encodeURIComponent(tag.tag_name)}`}
            className={cn(
                "group flex flex-col justify-between p-4 bg-white dark:bg-black/20 border border-border/40 rounded-md hover:border-primary/40 hover:shadow-md transition-all duration-300 relative overflow-hidden",
                "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary/5 before:transition-all group-hover:before:bg-primary/40"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {tag.tag_name}
                </span>
                <HugeiconsIcon icon={TagIcon} size={12} className="text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">Count</span>
                <span className="text-xs font-mono font-medium text-primary/60 tabular-nums">
                    {tag.count.toString().padStart(2, '0')}
                </span>
            </div>
        </Link>
    );
}
