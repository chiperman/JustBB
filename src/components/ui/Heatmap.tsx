'use client';

import { useEffect, useState, useMemo } from 'react';
import { getMemoStats } from '@/actions/stats';
import { startOfDay, subDays, format, eachDayOfInterval, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { HeatmapModal } from './HeatmapModal';
import { useReducedMotion } from 'framer-motion';

// 定义接口以匹配 actions/stats.ts 的返回值
interface HeatmapStats {
    totalMemos: number;
    totalTags: number;
    firstMemoDate: string | null;
    days: Record<string, number>;
}

export function Heatmap() {
    const [stats, setStats] = useState<HeatmapStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number; left: number; top: number } | null>(null);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        getMemoStats().then((data) => {
            setStats(data as HeatmapStats);
            setLoading(false);
        });
    }, []);

    // 计算总天数
    const totalActiveDays = useMemo(() => {
        if (!stats?.firstMemoDate) return 0;
        return differenceInDays(new Date(), new Date(stats.firstMemoDate)) + 1;
    }, [stats]);

    // 生成最近 12 周 (84 天) 的日期数据
    const heatmapDays = useMemo(() => {
        const today = startOfDay(new Date());
        const start = subDays(today, 83); // 12 weeks = 84 days
        return eachDayOfInterval({ start, end: today });
    }, []);

    // 计算颜色等级 (使用 CSS 变量以确保主题切换正确)
    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-[var(--heatmap-0)]';
        if (count <= 2) return 'bg-[var(--heatmap-1)]';
        if (count <= 5) return 'bg-[var(--heatmap-2)]';
        if (count <= 9) return 'bg-[var(--heatmap-3)]';
        return 'bg-[var(--heatmap-4)]';
    };

    if (loading) {
        return (
            <div className="w-full space-y-4 py-4 px-2">
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-md" />
                    ))}
                </div>
                <div className="h-32 bg-muted/10 animate-pulse rounded-lg" />
            </div>
        );
    }

    const Trigger = (
        <div className="w-full space-y-4 px-1 cursor-pointer group/container outline-none focus:ring-0 relative overflow-visible">
            {/* 顶栏统计 */}
            <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center group-hover/container:opacity-80 transition-opacity">
                    <span className="text-3xl font-serif tracking-tight">{stats?.totalMemos || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-1 font-sans">笔记</span>
                </div>
                <div className="flex flex-col items-center border-x border-muted/30 group-hover/container:opacity-80 transition-opacity">
                    <span className="text-3xl font-serif tracking-tight">{stats?.totalTags || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-1 font-sans">标签</span>
                </div>
                <div className="flex flex-col items-center group-hover/container:opacity-80 transition-opacity">
                    <span className="text-3xl font-serif tracking-tight leading-none">{totalActiveDays}</span>
                    <span className="text-[11px] text-muted-foreground mt-2 font-sans">天</span>
                </div>
            </div>

            {/* 热力图主体 */}
            <div className="relative pt-2" onMouseLeave={() => setHoveredDate(null)}>
                <div className="relative overflow-visible">
                    <div
                        className="grid grid-rows-7 grid-flow-col gap-[5px] justify-center"
                        style={{ gridTemplateRows: 'repeat(7, 14px)' }}
                    >
                        {heatmapDays.map((date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const count = stats?.days[dateStr] || 0;

                            return (
                                <div
                                    key={dateStr}
                                    tabIndex={0}
                                    role="gridcell"
                                    aria-label={`${dateStr}: ${count} 记录`}
                                    className={cn(
                                        "w-[14px] h-[14px] rounded-[4px] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none",
                                        !shouldReduceMotion && "hover:scale-110",
                                        getColorClass(count)
                                    )}
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const containerRect = e.currentTarget.offsetParent?.getBoundingClientRect();
                                        if (containerRect) {
                                            setHoveredDate({
                                                date: format(date, 'yyyy-MM-dd'),
                                                count,
                                                left: rect.left - containerRect.left + 7,
                                                top: rect.top - containerRect.top
                                            });
                                        }
                                    }}
                                    onFocus={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const containerRect = e.currentTarget.offsetParent?.getBoundingClientRect();
                                        if (containerRect) {
                                            setHoveredDate({
                                                date: format(date, 'yyyy-MM-dd'),
                                                count,
                                                left: rect.left - containerRect.left + 7,
                                                top: rect.top - containerRect.top
                                            });
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            // 可以在由于这里是弹窗触发器，所以实际点击行为由 Trigger 包裹实现
                                        }
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Tooltip */}
                    {hoveredDate && (
                        <div
                            className="absolute z-[999] px-2.5 py-1.5 text-[10px] font-medium text-white bg-black/95 backdrop-blur-md rounded-md pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] animate-in fade-in zoom-in duration-150 shadow-2xl border border-white/20 whitespace-nowrap"
                            style={{ left: hoveredDate.left, top: hoveredDate.top }}
                        >
                            <span className="text-[#9be9a8] font-bold">{hoveredDate.count} 笔记</span>
                            <span className="mx-1.5 opacity-40">/</span>
                            <span>{hoveredDate.date}</span>
                        </div>
                    )}
                </div>

                {/* Month labels at bottom */}
                <div className="flex justify-between mt-2 px-1 text-[11px] text-muted-foreground font-sans font-medium opacity-60">
                    <span className="flex-1 text-center">十一月</span>
                    <span className="flex-1 text-center">十二月</span>
                    <span className="flex-1 text-center">一月</span>
                    <span className="flex-1 text-center">二月</span>
                </div>
            </div>
        </div>
    );

    return stats ? <HeatmapModal stats={stats} trigger={Trigger} /> : null;
}
