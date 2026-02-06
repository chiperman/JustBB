'use client';

import { useEffect, useState, useMemo } from 'react';
import { getMemoStats } from '@/actions/stats';
import { subDays, format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, it usually does in shadcn projects

export function Heatmap() {
    const [stats, setStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    useEffect(() => {
        getMemoStats().then((data) => {
            setStats(data);
            setLoading(false);
        });
    }, []);

    // 生成过去一年的日期数据
    const days = useMemo(() => {
        const today = new Date();
        const start = subDays(today, 365);
        return eachDayOfInterval({ start, end: today });
    }, []);

    // 计算颜色等级
    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-muted/20 dark:bg-muted/10';
        if (count <= 1) return 'bg-green-200 dark:bg-green-900/50';
        if (count <= 3) return 'bg-green-400 dark:bg-green-700/60';
        if (count <= 5) return 'bg-green-600 dark:bg-green-500/80';
        return 'bg-green-600 dark:bg-green-400';
    };

    if (loading) {
        return (
            <div className="h-24 w-full animate-pulse bg-muted/20 rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Loading activity...</span>
            </div>
        );
    }

    return (
        <div className="relative w-full mb-6" onMouseLeave={() => setHoveredDate(null)}>
            <div className="overflow-x-auto pb-3 scrollbar-hide">
                <div
                    className="grid grid-rows-7 grid-flow-col gap-[3px]"
                    style={{ gridTemplateRows: 'repeat(7, 10px)', width: 'fit-content' }}
                >
                    {days.length > 0 ? days.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const count = stats[dateStr] || 0;

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    "w-[10px] h-[10px] rounded-[2px] transition-colors duration-200 cursor-help",
                                    getColorClass(count)
                                )}
                                title={`${dateStr}: ${count} 记录`}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredDate({
                                        date: format(date, 'yyyy年MM月dd日'),
                                        count,
                                        x: rect.left,
                                        y: rect.top
                                    });
                                }}
                            />
                        );
                    }) : (
                        <div className="text-[10px] text-muted-foreground p-2">未获取到日期数据</div>
                    )}
                </div>
            </div>

            {/* Custom Tooltip */}
            {hoveredDate && (
                <div
                    className="fixed z-50 px-2 py-1 text-[10px] font-medium text-white bg-black/80 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-6px]"
                    style={{ left: hoveredDate.x + 5, top: hoveredDate.y }}
                >
                    {hoveredDate.count} 记录 on {hoveredDate.date}
                </div>
            )}
        </div>
    );
}
