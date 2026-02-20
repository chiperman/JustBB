/**
 * 画廊页 Loading 骨架屏
 * 匹配 GalleryPage 布局：标题 + 月份分组 + 瀑布流图片网格
 */
export default function GalleryLoading() {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-xl mx-auto space-y-12">
                    <section>
                        {/* Header 骨架 */}
                        <header className="mb-10">
                            <div className="h-9 w-20 bg-muted/40 rounded animate-pulse mb-2" />
                            <div className="space-y-1.5">
                                <div className="h-3.5 w-64 bg-muted/20 rounded animate-pulse" />
                                <div className="h-3.5 w-48 bg-muted/20 rounded animate-pulse" />
                            </div>
                        </header>

                        {/* 月份分组 + 图片网格骨架 */}
                        <div className="space-y-16">
                            {[1, 2].map(group => (
                                <div key={group} className="space-y-8">
                                    {/* 月份标题 */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-6 w-28 bg-muted/30 rounded animate-pulse" />
                                        <div className="h-px flex-1 bg-border/20" />
                                        <div className="h-3 w-14 bg-muted/20 rounded animate-pulse" />
                                    </div>

                                    {/* 瀑布流图片骨架 */}
                                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                        {[180, 240, 160, 200, 280, 220].slice(0, group === 1 ? 4 : 2).map((h, i) => (
                                            <div key={i} className="break-inside-avoid">
                                                <div
                                                    className="p-2 bg-white dark:bg-black shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] rounded-sm border border-border/50"
                                                >
                                                    <div
                                                        className="bg-muted/20 rounded-[1px] animate-pulse"
                                                        style={{ height: `${h}px` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
