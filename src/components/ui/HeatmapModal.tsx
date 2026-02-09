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
    DialogClose,
} from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

import { YearlyStats } from './YearlyStats';

interface DayStats {
    count: number;
    wordCount: number;
    date: string;
}

interface HeatmapStats {
    totalMemos: number;
    totalTags: number;
    firstMemoDate: string | null;
    days: Record<string, DayStats>;
}

interface HeatmapModalProps {
    stats: HeatmapStats;
    trigger: React.ReactNode;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        } as const
    }
};

const viewVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 20 : -20,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 20 : -20,
        opacity: 0
    })
};

export function HeatmapModal({ stats, trigger }: HeatmapModalProps) {
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

    // Calculate available years from stats
    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        if (!stats.firstMemoDate) return [currentYear];
        const startYear = getYear(new Date(stats.firstMemoDate));
        const years = [];
        for (let y = currentYear; y >= startYear; y--) {
            years.push(y);
        }
        return years;
    }, [stats.firstMemoDate]);

    const [selectedYear, setSelectedYear] = useState<string>(() => {
        const currentYear = new Date().getFullYear();
        return String(currentYear);
    });

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
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col bg-[#F9F9F9] border-none p-0 overflow-hidden 
                !animate-none !duration-0 !transition-none
                [&>button]:hidden text-foreground">

                <div className="flex-none sticky top-0 z-50 bg-[#F9F9F9]/80 backdrop-blur-xl px-10 py-6 flex items-center justify-between border-b border-black/5">
                    <DialogTitle className="text-lg font-bold tracking-tight z-10">记录统计</DialogTitle>

                    {/* Centered Toggle Switch */}
                    <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/5 p-1 rounded-xl pointer-events-auto flex relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('month')}
                                className={cn(
                                    "relative z-10 px-6 py-1 text-sm h-8 rounded-lg transition-colors hover:bg-transparent",
                                    viewMode === 'month' ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground font-medium"
                                )}
                            >
                                {viewMode === 'month' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white shadow-sm rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">月</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('year')}
                                className={cn(
                                    "relative z-10 px-6 py-1 text-sm h-8 rounded-lg transition-colors hover:bg-transparent",
                                    viewMode === 'year' ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground font-medium"
                                )}
                            >
                                {viewMode === 'year' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white shadow-sm rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">年</span>
                            </Button>
                        </div>
                    </div>

                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5 z-10">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </div>

                <div className="flex-1 overflow-y-auto px-10 pt-6 pb-10 flex flex-col">
                    <AnimatePresence mode="wait" initial={false}>
                        {viewMode === 'month' ? (
                            <motion.div
                                key="month-view"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-6"
                            >
                                <div className="flex items-center mb-2">
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger variant="ghost" className="w-auto p-0 h-auto text-2xl font-bold tracking-tight gap-2 hover:bg-transparent px-0 data-[state=open]:bg-transparent focus:ring-0 focus:ring-offset-0">
                                            <SelectValue placeholder="年份" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="min-w-[100px]">
                                            {availableYears.map(year => (
                                                <SelectItem key={year} value={String(year)}>{year}年</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <motion.div
                                    key={selectedYear}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pb-20"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                >
                                    {(() => {
                                        const targetYear = Number(selectedYear);
                                        const isCurrentYear = targetYear === new Date().getFullYear();
                                        const months: Date[] = eachMonthOfInterval({
                                            start: startOfYear(new Date(targetYear, 0, 1)),
                                            end: isCurrentYear ? new Date() : endOfYear(new Date(targetYear, 0, 1))
                                        }).reverse();
                                        return months;
                                    })().map((month) => {
                                        return (
                                            <motion.div key={month.toISOString()} variants={itemVariants}>
                                                <MonthCalendar
                                                    date={month}
                                                    stats={stats.days}
                                                    colorFn={getColorClass}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="year-view"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <YearlyStats stats={stats.days} firstMemoDate={stats.firstMemoDate} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MonthCalendar({ date, stats, colorFn }: { date: Date, stats: Record<string, DayStats>, colorFn: (c: number) => string }) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const monthStats = useMemo(() => {
        let count = 0;
        let daysWithMemos = 0;
        eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(d => {
            const dayStat = stats[format(d, 'yyyy-MM-dd')];
            if (dayStat) {
                count += dayStat.count;
                if (dayStat.count > 0) daysWithMemos++;
            }
        });
        return { count, daysWithMemos };
    }, [stats, monthStart, monthEnd]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">{getYear(date) !== new Date().getFullYear() ? format(date, 'yyyy年 M月') : format(date, 'M月')}</h3>
                <div className="flex gap-3 text-xs text-muted-foreground/60 font-medium">
                    <span>{monthStats.count} 笔记</span>
                    <span>{monthStats.daysWithMemos} 记录天数</span>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
                {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                    <span key={d} className="text-[10px] pb-1 font-bold text-muted-foreground/30">{d}</span>
                ))}
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayStat = stats[dateStr];
                    const count = dayStat?.count || 0;
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <motion.div
                            key={dateStr}
                            className="relative group/day aspect-square flex items-center justify-center cursor-default"
                            whileHover={isCurrentMonth && count > 0 ? { scale: 1.2, zIndex: 10 } : {}}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <div
                                className={cn(
                                    "w-full h-full rounded-[6px] transition-colors duration-200",
                                    !isCurrentMonth ? "opacity-0 pointer-events-none" : colorFn(count)
                                )}
                            />
                            {isCurrentMonth && (
                                <span className={cn(
                                    "absolute text-[10px] font-bold pointer-events-none",
                                    count > 5 ? "text-white" : "text-foreground/40"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            )}
                            {count > 0 && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover/day:opacity-100 transition-all scale-95 group-hover/day:scale-100 whitespace-nowrap z-20 pointer-events-none shadow-xl border border-white/10">
                                    <div className="font-bold">{count} 笔记</div>
                                    <div className="text-[9px] opacity-60 text-center">{dayStat?.wordCount || 0} 字</div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
