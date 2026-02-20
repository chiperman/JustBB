/**
 * 标签页 Loading 骨架屏
 * 匹配 TagsPage 布局：标题 + 字母索引分组 + 标签卡片网格
 */
export default function TagsLoading() {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-xl mx-auto space-y-12">
                    <section>
                        {/* Header 骨架 */}
                        <header className="mb-12 border-b border-border/20 pb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-muted/20 rounded animate-pulse" />
                                <div className="h-9 w-24 bg-muted/40 rounded animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-3.5 w-80 bg-muted/20 rounded animate-pulse" />
                                <div className="h-3.5 w-48 bg-muted/20 rounded animate-pulse" />
                            </div>
                        </header>

                        {/* 字母分组 + 标签卡片网格骨架 */}
                        <div className="space-y-16">
                            {['A', 'B', 'C'].map(letter => (
                                <div key={letter} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-8">
                                    {/* 字母索引 */}
                                    <div className="flex md:flex-col items-center md:items-start">
                                        <span className="text-4xl font-serif font-bold text-primary/10 select-none">
                                            {letter}
                                        </span>
                                        <div className="h-px md:w-full flex-1 md:flex-none bg-border/20 ml-4 md:ml-0 md:mt-2" />
                                    </div>

                                    {/* 标签卡片 */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="flex flex-col justify-between p-4 bg-white dark:bg-black/20 border border-border/40 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary/5"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="h-5 w-20 bg-muted/30 rounded animate-pulse" />
                                                    <div className="w-3 h-3 bg-muted/20 rounded animate-pulse" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2.5 w-10 bg-muted/15 rounded animate-pulse" />
                                                    <div className="h-3 w-6 bg-muted/20 rounded animate-pulse" />
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
