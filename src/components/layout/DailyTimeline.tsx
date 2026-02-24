'use client';

import { useEffect, useState } from 'react';
import { getMemos } from '@/actions/fetchMemos';
import { Memo } from '@/types/memo';
import { cn } from '@/lib/utils';
import { Timeline, TimelineItem, TimelineLine, TimelineDot, TimelineHeading, TimelineContent } from '@/components/ui/timeline';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-5 w-20" />
                </div>
                <Timeline>
                    {[1, 2, 3].map((i) => (
                        <TimelineItem key={i} className="pb-4 overflow-visible">
                            <TimelineLine />
                            <TimelineDot className="bg-[var(--heatmap-0)] border-[var(--heatmap-0)]" />
                            <TimelineHeading className="mb-6">
                                <Skeleton className={cn(
                                    "h-4",
                                    i % 2 === 0 ? "w-32" : "w-28"
                                )} />
                            </TimelineHeading>
                            <TimelineContent>
                                <div className="flex flex-col gap-3">
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <Timeline>
                <TimelineItem className="pb-4 overflow-visible">
                    <TimelineLine />
                    <TimelineDot className="bg-background border-border" />
                    <TimelineHeading className="mb-6">
                        <span className="text-sm font-bold font-mono tracking-tighter text-foreground">
                            {date}
                        </span>
                    </TimelineHeading>

                    <TimelineContent>
                        {memos.length === 0 ? (
                            <div className="text-muted-foreground italic">该日无记录</div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {memos.map((memo) => {
                                    const dateObj = new Date(memo.created_at);
                                    const timeStr = dateObj.toLocaleString('zh-CN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                        timeZone: 'Asia/Shanghai'
                                    });
                                    const isActive = activeMemoId === memo.id;

                                    return (
                                        <div key={memo.id} className="relative">
                                            {isActive && (
                                                <TimelineLine
                                                    active={true}
                                                    className="-left-[25px]"
                                                />
                                            )}
                                            <a
                                                href={`#memo-${memo.id}`}
                                                onClick={(e) => handleMemoClick(e, memo.id)}
                                                className={cn(
                                                    "text-[10px] transition-colors block py-0.5 pl-1 cursor-pointer font-mono font-bold tracking-tight",
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
        </motion.div>
    );
}
