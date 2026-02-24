'use client';

import { useEffect, useState, useMemo } from 'react';
import { getTimelineStats } from '@/actions/stats';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Timeline,
    TimelineContent,
    TimelineLine,
    TimelineDot,
    TimelineHeading,
    TimelineItem
} from '@/components/ui/timeline';
import { DailyTimeline } from './DailyTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/context/TimelineContext';
import { useView } from '@/context/ViewContext';

interface TimelineStats {
    days: Record<string, { count: number }>;
}

export function RightSidebar({ initialData }: { initialData?: TimelineStats }) {
    const [allDays, setAllDays] = useState<Record<string, { count: number }>>(initialData?.days || {});
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const { currentView } = useView();
    const searchParams = useSearchParams();

    // Only display on homepage
    const isHomePage = currentView === '/';

    // 读取 URL 筛选参数
    const dateFilter = searchParams.get('date');
    const yearFilter = searchParams.get('year');
    const monthFilter = searchParams.get('month');

    const { activeId, setActiveId, setManualClick } = useTimeline();

    // 自动滚动侧边栏以确保选中项可见
    useEffect(() => {
        if (activeId) {
            const element = document.getElementById(`nav-${activeId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeId]);

    // 当 URL 参数变化时（热力图筛选），同步本地高亮状态
    useEffect(() => {
        if (dateFilter) {
            setActiveId(`date-${dateFilter}`);
        } else if (yearFilter && monthFilter) {
            setActiveId(`month-${yearFilter}-${monthFilter}`);
        } else if (yearFilter) {
            setActiveId(`year-${yearFilter}`);
        }
    }, [dateFilter, yearFilter, monthFilter, setActiveId]);

    // 构建时间轴数据结构（始终基于全量数据）
    const fullTimeline = useMemo(() => {
        const structure = new Map<number, Map<number, Set<number>>>();

        Object.keys(allDays).forEach((dateStr) => {
            const parts = dateStr.split('-');
            if (parts.length < 3) return;

            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);

            if (isNaN(year) || isNaN(month) || isNaN(day)) return;

            if (!structure.has(year)) {
                structure.set(year, new Map());
            }
            const yearMap = structure.get(year)!;

            if (!yearMap.has(month)) {
                yearMap.set(month, new Set());
            }
            yearMap.get(month)?.add(day);
        });

        return Array.from(structure.keys())
            .sort((a, b) => b - a)
            .map(year => {
                const yearMap = structure.get(year)!;
                const months = Array.from(yearMap.keys())
                    .sort((a, b) => b - a)
                    .map(month => ({
                        month,
                        days: Array.from(yearMap.get(month)!).sort((a, b) => b - a)
                    }));
                return { year, months };
            });
    }, [allDays]);

    // 计算高亮状态 - 优先使用 Context 中的状态，其次是 URL 参数
    const isYearActive = (year: number) => {
        const id = `year-${year}`;
        if (activeId === id) return true;
        if (!activeId && yearFilter === String(year) && !monthFilter && !dateFilter) return true;
        return false;
    };

    const isMonthActive = (year: number, month: number) => {
        const id = `month-${year}-${month}`;
        if (activeId === id) return true;
        if (!activeId && yearFilter === String(year) && monthFilter === String(month) && !dateFilter) return true;
        return false;
    };

    const isDayActive = (dateStr: string) => {
        const id = `date-${dateStr}`;
        if (activeId === id) return true;
        if (!activeId && dateFilter === dateStr) return true;
        return false;
    };

    const monthNames = [
        '', '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];

    const cn = (...classes: (string | undefined | null | false)[]) => {
        return classes.filter(Boolean).join(' ');
    };

    const handleYearClick = (e: React.MouseEvent, year: number) => {
        const id = `year-${year}`;
        setManualClick(true);
        setActiveId(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleMonthClick = (e: React.MouseEvent, year: number, month: number) => {
        const id = `month-${year}-${month}`;
        setManualClick(true);
        setActiveId(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleDayClick = (e: React.MouseEvent, dateStr: string) => {
        const id = `date-${dateStr}`;
        setManualClick(true);
        setActiveId(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!isHomePage) return null;

    return (
        <aside className="hidden xl:flex w-80 h-full flex-col p-6 border-l border-border bg-background/50 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest font-mono border-b-2 border-primary/20 pb-1.5 flex-1">
                    时间轴
                </h3>
            </div>
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {!isMounted && Object.keys(allDays).length === 0 ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="space-y-8"
                        >
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="relative">
                                    <TimelineLine className="bg-[var(--heatmap-0)]" />
                                    <TimelineDot className="bg-[var(--heatmap-0)] border-[var(--heatmap-0)]" />
                                    <Skeleton className={cn(
                                        "h-4 mb-6",
                                        i % 2 === 0 ? "w-16" : "w-12"
                                    )} />
                                    <div className="pl-4 space-y-6">
                                        <div className="space-y-3">
                                            <Skeleton className={cn(
                                                "h-3",
                                                i % 2 === 0 ? "w-12" : "w-14"
                                            )} />
                                            <div className="space-y-2">
                                                <Skeleton className="h-2 w-10" />
                                                <Skeleton className="h-2 w-8" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : dateFilter ? (
                        <DailyTimeline key="daily" date={dateFilter} />
                    ) : (
                        <motion.div
                            key="main-timeline"
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="h-full flex flex-col"
                        >
                            <Timeline>
                                {Object.keys(allDays).length > 0 ? (
                                    fullTimeline.map((yearGroup) => (
                                        <TimelineItem key={yearGroup.year} className="pb-8 overflow-visible" id={`nav-year-${yearGroup.year}`}>
                                            <TimelineLine active={false} />
                                            <TimelineDot className={cn(
                                                "transition-all duration-300 top-1.5",
                                                isYearActive(yearGroup.year)
                                                    ? "bg-primary border-primary ring-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.3)] scale-110"
                                                    : "bg-background border-border"
                                            )} />
                                            <TimelineHeading className="mb-6">
                                                <a
                                                    href={`/?year=${yearGroup.year}`}
                                                    className={cn(
                                                        "transition-colors cursor-pointer text-sm font-bold font-mono tracking-tighter",
                                                        isYearActive(yearGroup.year)
                                                            ? "text-primary"
                                                            : "text-foreground hover:text-primary"
                                                    )}
                                                    onClick={(e) => handleYearClick(e, yearGroup.year)}
                                                >
                                                    {yearGroup.year}
                                                </a>
                                            </TimelineHeading>
                                            <TimelineContent>
                                                {yearGroup.months.map((monthGroup) => (
                                                    <div key={monthGroup.month} className="relative mb-6 last:mb-0" id={`nav-month-${yearGroup.year}-${monthGroup.month}`}>
                                                        <div className="relative mb-3">
                                                            {isMonthActive(yearGroup.year, monthGroup.month) && (
                                                                <TimelineLine
                                                                    active={true}
                                                                    className="-left-[25px]"
                                                                />
                                                            )}
                                                            <h5 className={cn(
                                                                "text-[11px] font-bold pl-1 transition-colors cursor-pointer block uppercase tracking-wide",
                                                                isMonthActive(yearGroup.year, monthGroup.month)
                                                                    ? "text-primary"
                                                                    : "text-muted-foreground/80 hover:text-primary"
                                                            )}>
                                                                <a
                                                                    href={`/?year=${yearGroup.year}&month=${monthGroup.month}`}
                                                                    className="block w-full"
                                                                    onClick={(e) => handleMonthClick(e, yearGroup.year, monthGroup.month)}
                                                                >
                                                                    {monthNames[monthGroup.month]}
                                                                </a>
                                                            </h5>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            {monthGroup.days.map((day) => {
                                                                const dateStr = `${yearGroup.year}-${String(monthGroup.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                                const isActive = isDayActive(dateStr);

                                                                return (
                                                                    <div key={day} className="relative" id={`nav-date-${dateStr}`}>
                                                                        {isActive && (
                                                                            <TimelineLine
                                                                                active={true}
                                                                                className="-left-[25px]"
                                                                            />
                                                                        )}
                                                                        <a
                                                                            href={`/?date=${dateStr}`}
                                                                            className={cn(
                                                                                "text-[10px] transition-colors block py-0.5 pl-1 cursor-pointer font-mono font-bold tracking-tight",
                                                                                isActive
                                                                                    ? "text-primary"
                                                                                    : "text-muted-foreground/50 hover:text-primary/70"
                                                                            )}
                                                                            onClick={(e) => handleDayClick(e, dateStr)}
                                                                        >
                                                                            {day}号
                                                                        </a>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </TimelineContent>
                                        </TimelineItem>
                                    ))
                                ) : (
                                    <div className="text-xs text-muted-foreground/50 py-4 font-mono">
                                        暂无记录
                                    </div>
                                )}
                            </Timeline>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside >
    );
}
