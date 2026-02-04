'use client';

import { useEffect, useState } from 'react';
import { getOnThisDayMemos } from '@/actions/history';
import { History } from 'lucide-react';
import { Memo } from '@/types/memo';

export function OnThisDay() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getOnThisDayMemos().then((data: Memo[]) => {
            setMemos(data);
            setLoading(false);
        });
    }, []);

    if (loading || memos.length === 0) return null;

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-left-1 duration-500">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 font-sans flex items-center gap-2">
                <History className="w-3 h-3" /> 去年今日
            </h3>
            <div className="space-y-3">
                {memos.map((memo) => (
                    <div key={memo.id} className="bg-muted/10 border border-border/50 rounded-lg p-3 text-sm hover:bg-muted/20 transition-colors group cursor-default">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(memo.created_at).getFullYear()}
                            </span>
                        </div>
                        <p className="line-clamp-3 text-muted-foreground/80 group-hover:text-primary/80 transition-colors text-xs leading-relaxed">
                            {memo.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
