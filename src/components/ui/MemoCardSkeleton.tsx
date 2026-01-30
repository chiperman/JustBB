'use client';

export function MemoCardSkeleton() {
    return (
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
    );
}
