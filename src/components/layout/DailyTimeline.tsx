'use client';

import { useEffect, useState } from 'react';
import { getMemos } from '@/actions/fetchMemos';
import { Memo } from '@/types/memo';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timeline, TimelineItem, TimelineLine, TimelineDot } from '@/components/ui/timeline';

interface DailyTimelineProps {
    date: string;
}

export function DailyTimeline({ date }: DailyTimelineProps) {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMemoId, setActiveMemoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDailyMemos = async () => {
            setLoading(true);
            try {
                const data = await getMemos({ date, limit: 100 });
                setMemos(data || []);
            } catch (error) {
                console.error('Failed to fetch daily memos:', error);
            } finally {
                setLoading(false);
            }
        };

        if (date) {
            fetchDailyMemos();
        }
    }, [date]);

    const handleMemoClick = (e: React.MouseEvent, memoId: string) => {
        e.preventDefault();
        setActiveMemoId(memoId);
        const element = document.getElementById(`memo-${memoId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest font-mono border-b-2 border-primary/20 pb-1.5 flex-1">
                    {date}
                </h3>
            </div>

            <Timeline className="pl-6 overflow-visible py-0">
                {memos.length === 0 ? (
                    <div className="text-sm text-muted-foreground pl-4 italic">该日无记录</div>
                ) : (
                    memos.map((memo, index) => {
                        const dateObj = new Date(memo.created_at);
                        const timeStr = dateObj.toLocaleString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        });
                        const isActive = activeMemoId === memo.id;

                        return (
                            <TimelineItem key={memo.id} className="pb-3 last:pb-0">
                                <TimelineLine active={isActive} />
                                <TimelineDot className={cn(
                                    "transition-all duration-300",
                                    isActive
                                        ? "bg-primary border-primary ring-primary/10 scale-110"
                                        : "bg-background border-border"
                                )} />

                                <a
                                    href={`#memo-${memo.id}`}
                                    onClick={(e) => handleMemoClick(e, memo.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300 group/link outline-none",
                                        isActive
                                            ? "text-primary bg-primary/5"
                                            : "hover:bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    <span className={cn(
                                        "text-sm font-bold font-mono tracking-tighter",
                                        isActive ? "text-primary" : "text-foreground/90 group-hover:text-foreground"
                                    )}>
                                        #{memo.memo_number}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-medium font-mono opacity-50",
                                        isActive ? "text-primary/70" : "text-muted-foreground group-hover:text-foreground/60"
                                    )}>
                                        - {timeStr}
                                    </span>
                                </a>
                            </TimelineItem>
                        );
                    })
                )}
            </Timeline>
        </div>
    );
}
