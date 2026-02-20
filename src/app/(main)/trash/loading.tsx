/**
 * 回收站页 Loading 骨架屏
 * 匹配 TrashClient 布局：标题 + memo 卡片列表
 */
export default function TrashLoading() {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-md mx-auto space-y-12">
                    <section>
                        {/* Header 骨架 */}
                        <header className="mb-10 flex items-end justify-between border-b border-border/20 pb-8">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-muted/20 rounded animate-pulse" />
                                    <div className="h-9 w-24 bg-muted/40 rounded animate-pulse" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="h-3.5 w-64 bg-muted/20 rounded animate-pulse" />
                                    <div className="h-3.5 w-48 bg-muted/20 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
                            </div>
                        </header>

                        {/* Memo 卡片列表骨架 */}
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="group relative">
                                    <div className="opacity-60 rounded-sm">
                                        <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
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
