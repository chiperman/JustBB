'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Tag01Icon as TagIcon } from '@hugeicons/core-free-icons';
import { useTagGroups, TagData } from './hooks/useTagGroups';
import { TagCard } from './components/TagCard';

interface TagsPageContentProps {
    tags?: TagData[];
}

export function TagsPageContent({ tags: initialTags }: TagsPageContentProps) {
    const { tags, groupedTags, groups, isLoading } = useTagGroups(initialTags);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-xl mx-auto space-y-12">
                    <section>
                        <header className="mb-12 border-b border-border/20 pb-8">
                            <h2 className="text-3xl font-bold tracking-tight mb-3 italic flex items-center gap-3">
                                <HugeiconsIcon icon={TagIcon} size={32} className="text-primary/60" /> 标签墙
                            </h2>
                            <p className="text-muted-foreground text-sm tracking-wide opacity-70 italic">
                                Organize your thoughts through structural indices. {"\n"}
                                思想的索引，灵感的卡片。
                            </p>
                        </header>

                        {isLoading ? (
                            <div className="space-y-16">
                                {['A', 'B', 'C'].map(letter => (
                                    <div key={letter} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-8">
                                        <div className="flex md:flex-col items-center md:items-start">
                                            <span className="text-4xl font-serif font-bold text-primary/10 select-none">{letter}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-20 bg-muted/20 rounded-md animate-pulse border border-border/20" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : tags.length === 0 ? (
                            <div className="text-center py-20 bg-muted/5 rounded-md border border-dashed border-border/30">
                                <p className="italic text-muted-foreground opacity-60">暂无标签记录</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {groups.map(group => (
                                    <div key={group} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-8">
                                        <div className="flex md:flex-col items-center md:items-start">
                                            <span className="text-4xl font-bold text-primary/20 select-none">
                                                {group}
                                            </span>
                                            <div className="h-px md:w-full flex-1 md:flex-none bg-border/20 ml-4 md:ml-0 md:mt-2" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {groupedTags[group].map((tag) => (
                                                <TagCard key={tag.tag_name} tag={tag} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
