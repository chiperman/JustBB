'use client';

import { useEffect, useState } from 'react';
import { getMemos } from '@/actions/fetchMemos';
import { Memo } from '@/types/memo';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timeline, TimelineItem, TimelineLine, TimelineDot, TimelineHeading, TimelineContent } from '@/components/ui/timeline';

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
                    时间轴
                </h3>
            </div>

            <Timeline className="pl-6">
                <TimelineItem className="pb-4 overflow-visible">
                    <TimelineLine />
                    <TimelineDot className="bg-background border-border" />
                    <TimelineHeading className="mb-6">
                        <span className="text-sm font-bold font-mono tracking-tighter text-foreground">
                            {date}
                        </span>
                    </TimelineHeading>

                    <TimelineContent className="pl-1">
                        {memos.length === 0 ? (
                            <div className="text-sm text-muted-foreground pl-3 italic">该日无记录</div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {memos.map((memo) => {
                                    const dateObj = new Date(memo.created_at);
                                    const timeStr = dateObj.toLocaleString('zh-CN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    });
                                    const isActive = activeMemoId === memo.id;

                                    return (
                                        <div key={memo.id} className="relative">
                                            <TimelineLine
                                                active={isActive}
                                                className="-left-[29px]"
                                            />
                                            <a
                                                href={`#memo-${memo.id}`}
                                                onClick={(e) => handleMemoClick(e, memo.id)}
                                                className={cn(
                                                    "text-[10px] transition-colors block py-0.5 pl-3 cursor-pointer font-mono font-bold tracking-tight",
                                                    isActive
                                                        ? "text-primary"
                                                        : "text-muted-foreground/50 hover:text-primary/70"
                                                )}
                                            >
                                                #{memo.memo_number} - {timeStr}
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TimelineContent>
                </TimelineItem>
            </Timeline>
        </div>
    );
}
