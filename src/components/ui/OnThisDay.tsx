'use client';

import { useEffect, useState, memo } from 'react';
import { getOnThisDayMemos } from '@/actions/history';
import { History } from 'lucide-react';
import { Memo } from '@/types/memo';
import { cn } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';

export const OnThisDay = memo(function OnThisDay() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(true);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        getOnThisDayMemos().then((data: Memo[]) => {
            setMemos(data);
            setLoading(false);
        });
    }, []);

    if (loading || memos.length === 0) return null;

    return (
        <section
            className="mb-8 animate-in fade-in slide-in-from-left-2 duration-700"
            aria-labelledby="history-title"
        >
            <h3
                id="history-title"
                className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.2em] mb-4 font-sans flex items-center gap-2"
            >
                <History className="w-3.5 h-3.5" aria-hidden="true" /> 去年今日
            </h3>
            <ul className="space-y-4" role="list">
                {memos.map((memo) => (
                    <li
                        key={memo.id}
                        className={cn(
                            "bg-muted/10 border border-border/40 rounded-xl p-4 text-sm hover:bg-accent hover:border-border/80 transition-all group lg:last:hidden xl:last:block outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                            !shouldReduceMotion && "hover:translate-x-1"
                        )}
                        tabIndex={0}
                    >
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-mono font-bold text-primary/40 group-hover:text-primary transition-colors">
                                {new Date(memo.created_at).getFullYear()}
                            </span>
                        </div>
                        <p className="line-clamp-4 text-muted-foreground/90 group-hover:text-foreground transition-colors text-[13px] leading-relaxed font-serif">
                            {memo.content}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
});
