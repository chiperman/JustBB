'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Tag01Icon as TagIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TagData } from '../hooks/useTagGroups';

export function TagCard({ tag }: { tag: TagData }) {
    return (
        <Link
            href={`/?tag=${encodeURIComponent(tag.tag_name)}`}
            className={cn(
                'group flex min-h-28 flex-col justify-between rounded-2xl border border-border/60 bg-card/50 p-4 shadow-sm transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card'
            )}
        >
            <div className="space-y-3">
                <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
                    <HugeiconsIcon icon={TagIcon} size={12} className="text-primary/70" />
                    <span>标签索引</span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-base font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
                        #{tag.tag_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {tag.count} 条记录
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-mono tabular-nums text-primary/70">
                    {tag.count.toString().padStart(2, '0')}
                </span>
                <span className="inline-flex items-center gap-1 transition-colors group-hover:text-primary">
                    查看记录
                    <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                </span>
            </div>
        </Link>
    );
}
