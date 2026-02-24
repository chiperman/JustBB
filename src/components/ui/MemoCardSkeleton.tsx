interface MemoCardSkeletonProps {
    isEmpty?: boolean;
}

export function MemoCardSkeleton({ isEmpty = false }: MemoCardSkeletonProps) {
    return (
        <div className={`bg-card border border-border rounded-2xl p-6 ${isEmpty ? 'opacity-80' : 'animate-pulse'} relative overflow-hidden`}>
            {isEmpty && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/40 backdrop-blur-[1px]">
                    <span className="text-sm font-medium text-muted-foreground/60 tracking-wider">暂无记录</span>
                </div>
            )}
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
    );
}
