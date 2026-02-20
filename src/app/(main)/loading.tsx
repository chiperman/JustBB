/**
 * 首页 Loading 骨架屏
 * 匹配 MainLayoutClient 布局：FeedHeader + MemoEditor + MemoFeed
 */
export default function HomeLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-accent/20 font-sans">
            {/* 固定顶部区域 - 品牌、搜索 & 编辑器 */}
            <div className="flex-none z-30 px-4 md:px-10 md:pr-[calc(2.5rem+4px)] sticky top-0 pt-8 pb-4 bg-background/0">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="space-y-4">
                        {/* FeedHeader 骨架 */}
                        <div className="flex items-center justify-between gap-4 py-2 h-10">
                            <div className="flex items-center gap-1.5">
                                <div className="h-5 w-24 bg-muted/40 rounded animate-pulse" />
                                <div className="h-8 w-8 bg-muted/20 rounded-sm" />
                            </div>
                            <div className="flex-1 max-w-sm">
                                <div className="h-8 w-full bg-muted/20 rounded-sm animate-pulse" />
                            </div>
                        </div>

                        {/* MemoEditor 骨架 */}
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 space-y-3">
                            <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
                            <div className="flex justify-end gap-2 pt-1">
                                <div className="h-7 w-16 bg-muted/20 rounded-sm animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 滚动内容流区域 - MemoFeed 骨架 */}
            <div className="flex-1 overflow-y-auto scrollbar-hover p-4 md:px-10 md:pt-0 md:pb-8">
                <div className="max-w-4xl mx-auto w-full pb-20 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-5 bg-muted rounded" />
                                <div className="w-32 h-4 bg-muted/60 rounded" />
                            </div>
                            <div className="space-y-3">
                                <div className="w-full h-4 bg-muted rounded" />
                                <div className="w-[90%] h-4 bg-muted rounded" />
                                <div className="w-[40%] h-4 bg-muted rounded" />
                            </div>
                            <div className="mt-8 flex gap-2">
                                <div className="w-16 h-5 bg-muted/50 rounded-full" />
                                <div className="w-16 h-5 bg-muted/50 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
