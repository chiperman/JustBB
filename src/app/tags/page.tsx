import { getAllTags } from "@/actions/tags";
import { Suspense } from 'react';
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import Link from "next/link";
import { Tag } from "lucide-react";

export default async function TagsPage() {
    const tags = await getAllTags();

    // Find max count for font scaling logic (simple version)
    const maxCount = Math.max(...tags.map(t => t.count), 1);

    return (
        <div className="flex min-h-screen justify-center selection:bg-primary/20">
            <div className="flex w-full max-w-(--breakpoint-2xl)">
                {/* 左侧导航 */}
                <Suspense fallback={<div className="w-64" />}>
                    <LeftSidebar />
                </Suspense>

                {/* 内容区域 */}
                <main className="flex-1 min-w-0 bg-background px-4 md:px-8 py-10">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
                                <Tag className="w-6 h-6" /> 标签墙 / Tags
                            </h1>
                            <p className="text-muted-foreground text-sm">Organize your thoughts.</p>
                        </div>

                        {tags.length === 0 ? (
                            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50">
                                <p className="text-muted-foreground">暂无标签</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-4 content-start">
                                {tags.map((tag) => {
                                    // Calculate size roughly between 1rem (base) and 2.5rem
                                    // Log scale might be better but linear is fine for small ranges
                                    const scale = 1 + (tag.count / maxCount) * 0.5;

                                    return (
                                        <Link
                                            key={tag.tag_name}
                                            href={`/?q=${encodeURIComponent(tag.tag_name)}`}
                                            className="group relative flex items-center gap-2 px-4 py-2 bg-muted/20 hover:bg-primary/10 border border-border/50 hover:border-primary/30 rounded-full transition-all duration-300"
                                            style={{
                                                fontSize: `${scale}rem`
                                            }}
                                        >
                                            <span className="text-foreground group-hover:text-primary transition-colors font-medium text-base">
                                                #{tag.tag_name}
                                            </span>
                                            <span className="px-2 py-0.5 text-xs bg-muted/50 rounded-full text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                {tag.count}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                {/* 右侧边栏 */}
                <Suspense fallback={<div className="w-80" />}>
                    <RightSidebar />
                </Suspense>
            </div>
        </div>
    );
}
