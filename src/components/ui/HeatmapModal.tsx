'use client';

import { useState, useMemo } from 'react';
import {
    format,
    startOfYear,
    endOfYear,
    eachMonthOfInterval,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    getYear,
    startOfWeek,
    endOfWeek,
    isSameMonth
} from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface HeatmapStats {
    totalMemos: number;
    totalTags: number;
    firstMemoDate: string | null;
    days: Record<string, number>;
}

interface HeatmapModalProps {
    stats: HeatmapStats;
    trigger: React.ReactNode;
}

export function HeatmapModal({ stats, trigger }: HeatmapModalProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

    // 获取所有存在的年份
    const availableYears = useMemo(() => {
        if (!stats.firstMemoDate) return [new Date().getFullYear()];
        const startYear = getYear(new Date(stats.firstMemoDate));
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear; y >= startYear; y--) {
            years.push(y);
        }
        return years;
    }, [stats.firstMemoDate]);

    // 计算颜色等级 (使用 CSS 变量)
    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-[var(--heatmap-0)]';
        if (count <= 2) return 'bg-[var(--heatmap-1)]';
        if (count <= 5) return 'bg-[var(--heatmap-2)]';
        if (count <= 9) return 'bg-[var(--heatmap-3)]';
        return 'bg-[var(--heatmap-4)]';
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border-muted/20">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-muted/10">
                    <div className="flex items-center gap-4">
                        <DialogTitle className="text-xl font-bold tracking-tight">记录统计</DialogTitle>
                        <div className="flex bg-muted/20 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn(
                                    "px-3 py-1 text-xs rounded-md transition-all",
                                    viewMode === 'month' ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                月
                            </button>
                            <button
                                onClick={() => setViewMode('year')}
                                className={cn(
                                    "px-3 py-1 text-xs rounded-md transition-all",
                                    viewMode === 'year' ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                年
                            </button>
                        </div>
                    </div>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-muted/20 border-none text-sm font-medium rounded-md px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}年</option>
                        ))}
                    </select>
                </DialogHeader>

                <div className="py-6">
                    {viewMode === 'month' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {eachMonthOfInterval({
                                start: startOfYear(new Date(selectedYear, 0, 1)),
                                end: endOfYear(new Date(selectedYear, 0, 1))
                            }).reverse().map((month) => (
                                <MonthCalendar
                                    key={month.toISOString()}
                                    date={month}
                                    stats={stats.days}
                                    colorFn={getColorClass}
                                />
                            ))}
                        </div>
                    ) : (
                        <YearHeatmap
                            year={selectedYear}
                            stats={stats.days}
                            colorFn={getColorClass}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MonthCalendar({ date, stats, colorFn }: { date: Date, stats: Record<string, number>, colorFn: (c: number) => string }) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const monthStats = useMemo(() => {
        let count = 0;
        let daysWithMemos = 0;
        eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(d => {
            const c = stats[format(d, 'yyyy-MM-dd')] || 0;
            count += c;
            if (c > 0) daysWithMemos++;
        });
        return { count, daysWithMemos };
    }, [stats, monthStart, monthEnd]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{format(date, 'M月')}</h3>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span>{monthStats.count} 笔记</span>
                    <span>{monthStats.daysWithMemos} 记录天数</span>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                    <span key={d} className="text-[10px] pb-1 opacity-40">{d}</span>
                ))}
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = stats[dateStr] || 0;
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div key={dateStr} className="relative group/day aspect-square flex items-center justify-center">
                            <div
                                className={cn(
                                    "w-full h-full rounded-[4px] transition-all duration-200",
                                    !isCurrentMonth ? "opacity-0 pointer-events-none" : colorFn(count)
                                )}
                            />
                            {isCurrentMonth && (
                                <span className={cn(
                                    "absolute text-[9px] font-medium pointer-events-none",
                                    count > 5 ? "text-white" : "text-foreground/60"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            )}
                            {count > 0 && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/day:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {count} 笔记
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function YearHeatmap({ year, stats, colorFn }: { year: number, stats: Record<string, number>, colorFn: (c: number) => string }) {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 0, 1));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
            <div
                className="grid grid-rows-7 grid-flow-col gap-[5px]"
                style={{ gridTemplateRows: 'repeat(7, 14px)' }}
            >
                {days.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const count = stats[dateStr] || 0;
                    return (
                        <div
                            key={dateStr}
                            className={cn(
                                "w-[14px] h-[14px] rounded-[4px] cursor-help transition-colors",
                                colorFn(count)
                            )}
                            title={`${dateStr}: ${count} 笔记`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
