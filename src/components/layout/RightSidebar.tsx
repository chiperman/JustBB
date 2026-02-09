'use client';

import { useEffect, useState, useMemo } from 'react';
import { getMemoStats } from '@/actions/stats';
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

export function RightSidebar() {
    const [allDays, setAllDays] = useState<Record<string, number>>({});
    const router = useRouter();
    const searchParams = useSearchParams();

    // 读取 URL 筛选参数
    const dateFilter = searchParams.get('date');
    const yearFilter = searchParams.get('year');
    const monthFilter = searchParams.get('month');

    const [localActiveId, setLocalActiveId] = useState<string | null>(null);

    useEffect(() => {
        getMemoStats().then((data) => {
            setAllDays(data.days || {});
        });
    }, []);

    // 当 URL 参数变化时（热力图筛选），同步本地高亮状态
    useEffect(() => {
        if (dateFilter) {
            setLocalActiveId(`date-${dateFilter}`);
        } else if (yearFilter && monthFilter) {
            setLocalActiveId(`month-${yearFilter}-${monthFilter}`);
        } else if (yearFilter) {
            setLocalActiveId(`year-${yearFilter}`);
        }
    }, [dateFilter, yearFilter, monthFilter]);

    // 构建时间轴数据结构（始终基于全量数据）
    const fullTimeline = useMemo(() => {
        const structure = new Map<number, Map<number, Set<number>>>();

        Object.keys(allDays).forEach((dateStr) => {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();

            if (isNaN(year)) return;

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

    // 计算高亮状态 - 优先使用本地状态，如果没有则根据 URL 参数判断
    const isYearActive = (year: number) => {
        if (localActiveId === `year-${year}`) return true;
        // 如果没有本地手动选中的，则看 URL 参数
        if (!localActiveId && yearFilter === String(year) && !monthFilter && !dateFilter) return true;
        return false;
    };

    const isMonthActive = (year: number, month: number) => {
        const id = `month-${year}-${month}`;
        if (localActiveId === id) return true;
        if (!localActiveId && yearFilter === String(year) && monthFilter === String(month) && !dateFilter) return true;
        return false;
    };

    const isDayActive = (dateStr: string) => {
        const id = `date-${dateStr}`;
        if (localActiveId === id) return true;
        if (!localActiveId && dateFilter === dateStr) return true;
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
        e.preventDefault();
        const id = `year-${year}`;
        setLocalActiveId(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleMonthClick = (e: React.MouseEvent, year: number, month: number) => {
        e.preventDefault();
        const id = `month-${year}-${month}`;
        setLocalActiveId(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleDayClick = (e: React.MouseEvent, dateStr: string) => {
        e.preventDefault();
        const id = `date-${dateStr}`;
        setLocalActiveId(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <aside className="hidden xl:flex w-80 h-full flex-col p-6 border-l border-border bg-background/50 backdrop-blur-md">
            <div className="flex-1">
                {dateFilter ? (
                    <DailyTimeline date={dateFilter} />
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest font-mono border-b-2 border-primary/20 pb-1.5 flex-1">
                                时间轴
                            </h3>
                        </div>
                        <Timeline className="pl-6">
                            {fullTimeline.map((yearGroup) => (
                                <TimelineItem key={yearGroup.year} className="pb-8 overflow-visible">
                                    <TimelineLine active={isYearActive(yearGroup.year)} />
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
                                    <TimelineContent className="pl-1">
                                        {yearGroup.months.map((monthGroup) => (
                                            <div key={monthGroup.month} className="relative mb-6 last:mb-0">
                                                <TimelineLine
                                                    active={isMonthActive(yearGroup.year, monthGroup.month)}
                                                    className="-left-[29px]"
                                                />
                                                <h5 className={cn(
                                                    "text-[11px] font-bold mb-3 pl-3 transition-colors cursor-pointer block uppercase tracking-wide",
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
                                                <div className="flex flex-col gap-1.5">
                                                    {monthGroup.days.map((day) => {
                                                        const dateStr = `${yearGroup.year}-${String(monthGroup.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                        const isActive = isDayActive(dateStr);

                                                        return (
                                                            <div key={day} className="relative">
                                                                <TimelineLine
                                                                    active={isActive}
                                                                    className="-left-[29px]"
                                                                />
                                                                <a
                                                                    href={`/?date=${dateStr}`}
                                                                    className={cn(
                                                                        "text-[10px] transition-colors block py-0.5 pl-3 cursor-pointer font-mono font-bold tracking-tight",
                                                                        isActive
                                                                            ? "text-primary"
                                                                            : "text-muted-foreground/50 hover:text-primary/70"
                                                                    )}
                                                                    onClick={(e) => handleDayClick(e, dateStr)}
                                                                >
                                                                    #{day}
                                                                </a>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                            {fullTimeline.length === 0 && (
                                <div className="text-sm text-muted-foreground pl-2">暂无数据</div>
                            )}
                        </Timeline>
                    </>
                )}
            </div>
        </aside>
    );
}
