import { getAllTags } from "@/actions/tags";
import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function TagsPage() {
    const tags = await getAllTags();

    // Group tags by initial letter (A-Z)
    const groupedTags = tags.reduce((acc, tag) => {
        const firstChar = tag.tag_name.charAt(0).toUpperCase();
        const group = /^[A-Z]$/.test(firstChar) ? firstChar : "#";
        if (!acc[group]) acc[group] = [];
        acc[group].push(tag);
        return acc;
    }, {} as Record<string, typeof tags>);

    const groups = Object.keys(groupedTags).sort((a, b) => {
        if (a === "#") return 1;
        if (b === "#") return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-xl mx-auto space-y-12">
                    <section>
                        <header className="mb-12 border-b border-border/20 pb-8">
                            <h2 className="text-3xl font-serif font-bold tracking-tight mb-3 italic flex items-center gap-3">
                                <TagIcon className="w-8 h-8 text-primary/60" /> 标签墙
                            </h2>
                            <p className="text-muted-foreground text-sm font-sans tracking-wide opacity-70 italic">
                                Organize your thoughts through structural indices. {"\n"}
                                思想的索引，灵感的卡片。
                            </p>
                        </header>

                        {tags.length === 0 ? (
                            <div className="text-center py-20 bg-muted/5 rounded-sm border border-dashed border-border/30">
                                <p className="font-serif italic text-muted-foreground opacity-60">暂无标签记录</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {groups.map(group => (
                                    <div key={group} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-8">
                                        <div className="flex md:flex-col items-center md:items-start">
                                            <span className="text-4xl font-serif font-bold text-primary/20 select-none">
                                                {group}
                                            </span>
                                            <div className="h-px md:w-full flex-1 md:flex-none bg-border/20 ml-4 md:ml-0 md:mt-2" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {groupedTags[group].map((tag) => (
                                                <Link
                                                    key={tag.tag_name}
                                                    href={`/?q=${encodeURIComponent(tag.tag_name)}`}
                                                    className={cn(
                                                        "group flex flex-col justify-between p-4 bg-white dark:bg-black/20 border border-border/40 rounded-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 relative overflow-hidden",
                                                        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary/5 before:transition-all group-hover:before:bg-primary/40"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <span className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                                                            {tag.tag_name}
                                                        </span>
                                                        <TagIcon className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">Count</span>
                                                        <span className="text-xs font-mono font-medium text-primary/60 tabular-nums">
                                                            {tag.count.toString().padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                </Link>
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
