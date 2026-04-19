'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tag01Icon as TagIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TagData } from '../hooks/useTagGroups';

export function TagCard({ tag }: { tag: TagData }) {
    return (
        <Link
            href={`/?tag=${encodeURIComponent(tag.tag_name)}`}
            className={cn(
                'group flex items-center justify-between rounded-card border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/40'
            )}
        >
            <div className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon icon={TagIcon} size={14} className="shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary/70" />
                <span className="truncate text-sm font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
                    #{tag.tag_name}
                </span>
            </div>

            <span className="shrink-0 text-xs font-mono tabular-nums text-muted-foreground">
                {tag.count.toString().padStart(2, '0')}
            </span>
        </Link>
    );
}
