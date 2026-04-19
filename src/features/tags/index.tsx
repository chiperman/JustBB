'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Tag01Icon as TagIcon } from '@hugeicons/core-free-icons';

import { Input } from '@/components/ui/input';
import { ContextPageHeader, ContextPageShell, ContextPageStat } from '@/components/layout/ContextPageShell';
import { cn } from '@/lib/utils';

import { useTagGroups, TagData, groupTagsByInitial } from './hooks/useTagGroups';
import { TagCard } from './components/TagCard';

interface TagsPageContentProps {
    tags?: TagData[];
}

export function TagsPageContent({ tags: initialTags }: TagsPageContentProps) {
    const [query, setQuery] = useState('');
    const { tags, isLoading } = useTagGroups(initialTags);

    const sortedTags = useMemo(
        () => [...tags].sort((a, b) => b.count - a.count || a.tag_name.localeCompare(b.tag_name)),
        [tags],
    );
    const totalGroupsCount = useMemo(() => groupTagsByInitial(sortedTags).groups.length, [sortedTags]);
    const featuredTags = sortedTags.slice(0, 8);
    const normalizedQuery = query.trim().toLowerCase();
    const visibleTags = useMemo(
        () => (!normalizedQuery
            ? sortedTags
            : sortedTags.filter((tag) => tag.tag_name.toLowerCase().includes(normalizedQuery))),
        [normalizedQuery, sortedTags],
    );
    const { groupedTags, groups } = useMemo(() => groupTagsByInitial(visibleTags), [visibleTags]);
    const topTag = featuredTags[0];

    return (
        <ContextPageShell
            header={(
                <ContextPageHeader
                    icon={TagIcon}
                    title="标签"
                    description="把标签页收回到和首页一致的阅读语境里。这里更像索引入口，而不是独立展墙。"
                    meta={(
                        <>
                            <ContextPageStat label="标签数" value={tags.length.toString().padStart(2, '0')} />
                            <ContextPageStat label="分组数" value={totalGroupsCount.toString().padStart(2, '0')} />
                            {topTag ? (
                                <ContextPageStat
                                    label="最高频"
                                    value={`#${topTag.tag_name}`}
                                    hint={`${topTag.count} 条记录`}
                                />
                            ) : null}
                        </>
                    )}
                />
            )}
        >
            <div className="space-y-8">
                <section className="rounded-2xl border border-border/60 bg-card/40 p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1">
                            <h2 className="text-sm font-medium tracking-tight text-foreground">
                                高频标签
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                先用最常出现的标签进入首页过滤态，再决定是否继续全文搜索。
                            </p>
                        </div>

                        <label className="relative w-full sm:max-w-xs">
                            <HugeiconsIcon
                                icon={Search01Icon}
                                size={14}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                            />
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="筛选标签..."
                                className="h-9 rounded-md border-border/60 bg-background/80 pl-9 shadow-none"
                            />
                        </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {featuredTags.length > 0 ? featuredTags.map((tag) => (
                            <Link
                                key={tag.tag_name}
                                href={`/?tag=${encodeURIComponent(tag.tag_name)}`}
                                className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                            >
                                <span className="font-medium">#{tag.tag_name}</span>
                                <span className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[11px] font-mono text-primary/70">
                                    {tag.count}
                                </span>
                            </Link>
                        )) : (
                            <p className="text-sm text-muted-foreground">
                                还没有可展示的标签频次。
                            </p>
                        )}
                    </div>
                </section>

                {isLoading ? (
                    <div className="space-y-8">
                        {['A', 'B', 'C'].map((group) => (
                            <div key={group} className="grid grid-cols-1 gap-4 sm:grid-cols-[56px_1fr]">
                                <div className="h-10 w-10 rounded-xl border border-border/50 bg-muted/20 animate-pulse" />
                                <div className="space-y-4">
                                    <div className="h-5 w-32 rounded bg-muted/20 animate-pulse" />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {[1, 2, 3, 4].map((item) => (
                                            <div
                                                key={item}
                                                className="h-28 rounded-2xl border border-border/40 bg-muted/20 animate-pulse"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : tags.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
                        <p className="text-sm text-muted-foreground">
                            暂无标签记录。写下第一条带标签的 Memo 之后，这里会自动形成索引。
                        </p>
                    </div>
                ) : visibleTags.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
                        <p className="text-sm text-muted-foreground">
                            没有找到匹配 “{query.trim()}” 的标签。
                        </p>
                    </div>
                ) : (
                    <section className="space-y-8">
                        {groups.map((group) => (
                            <div key={group} className="grid grid-cols-1 gap-4 sm:grid-cols-[56px_1fr]">
                                <div className="pt-1">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-sm font-semibold text-foreground/80 shadow-sm">
                                        {group}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-medium tracking-tight text-foreground">
                                            {group === '#' ? '其他标签' : `${group} 组`}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {groupedTags[group].length} 个标签
                                        </div>
                                        <div className="h-px flex-1 bg-border/60" />
                                    </div>

                                    <div className={cn('grid gap-3 sm:grid-cols-2')}>
                                        {groupedTags[group].map((tag) => (
                                            <TagCard key={tag.tag_name} tag={tag} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </div>
        </ContextPageShell>
    );
}
