'use client';

import { useEffect, useState, memo } from 'react';
import { getOnThisDayMemos } from '@/actions/history';
import { History } from 'lucide-react';
import { Memo } from '@/types/memo';
import { cn } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';

export const OnThisDay = memo(function OnThisDay({ initialMemos }: { initialMemos?: Memo[] }) {
    const [memos, setMemos] = useState<Memo[]>(initialMemos || []);
    const [loading, setLoading] = useState(!initialMemos?.length); // If we have intial data, not loading (unless length 0, but layout sends empty array if none)
    // Layout fetches data, so if it's passed, we trust it.
    // If layout passes [], it means no memos.
    // So loading should be false if initialMemos is defined (even if empty).
    const isInitialLoaded = Array.isArray(initialMemos);

    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (!isInitialLoaded) {
            getOnThisDayMemos().then((data: Memo[]) => {
                setMemos(data);
                setLoading(false);
            });
        }
    }, [isInitialLoaded]);

    if ((!isInitialLoaded && loading) || memos.length === 0) return null;

    return (
        <section
            className="mb-8 animate-in fade-in slide-in-from-left-2 duration-700"
            aria-labelledby="history-title"
        >
            <h3
                id="history-title"
                className="text-[24px] font-bold text-foreground leading-tight tracking-tight mb-4 flex items-center gap-2"
            >
                去年今日
            </h3>
            <ul className="flex flex-col gap-[16px]" role="list">
                {memos.map((memo) => (
                    <li
                        key={memo.id}
                        className={cn(
                            "bg-stone-50/50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-sm p-4 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-all group lg:last:hidden xl:last:block outline-none focus-visible:ring-0",
                            !shouldReduceMotion && "hover:translate-x-1"
                        )}
                        tabIndex={0}
                    >
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[12px] font-normal text-stone-400 group-hover:text-primary transition-colors">
                                {new Date(memo.created_at).getFullYear()}
                            </span>
                        </div>
                        <p className="line-clamp-4 text-[14px] font-normal leading-relaxed text-stone-600 dark:text-stone-400 group-hover:text-foreground transition-colors">
                            {memo.content}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
});
