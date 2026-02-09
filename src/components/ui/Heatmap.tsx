'use client';

import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { getMemoStats } from '@/actions/stats';
import { startOfDay, subDays, format, eachDayOfInterval, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { HeatmapModal } from './HeatmapModal';
import { useReducedMotion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

// 定义接口以匹配 actions/stats.ts 的返回值
interface HeatmapStats {
    totalMemos: number;
    totalTags: number;
    firstMemoDate: string | null;
    days: Record<string, { count: number; wordCount: number }>;
}

// 提取单元格组件以减少重渲染范围
const HeatmapCell = memo(({
    dateStr,
    count,
    isActive,
    onHover,
    onClick,
    shouldReduceMotion
}: {
    dateStr: string;
    count: number;
    isActive?: boolean;
    onHover: (e: React.MouseEvent | React.FocusEvent, date: string, count: number) => void;
    onClick: (e: React.MouseEvent, date: string) => void;
    shouldReduceMotion: boolean;
}) => {
    const getColorClass = (c: number) => {
        if (c === 0) return 'bg-[var(--heatmap-0)]';
        if (c <= 2) return 'bg-[var(--heatmap-1)]';
        if (c <= 5) return 'bg-[var(--heatmap-2)]';
        if (c <= 9) return 'bg-[var(--heatmap-3)]';
        return 'bg-[var(--heatmap-4)]';
    };

    const hasData = count > 0;

    return (
        <div
            tabIndex={hasData ? 0 : -1}
            role="gridcell"
            aria-label={`${dateStr}: ${count} 记录`}
            className={cn(
                "w-[14px] h-[14px] rounded transition-all outline-none",
                hasData && "cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                hasData && !shouldReduceMotion && "hover:scale-110",
                isActive && "ring-2 ring-primary ring-offset-1 z-10",
                getColorClass(count)
            )}
            onMouseEnter={(e) => onHover(e, dateStr, count)}
            onFocus={(e) => hasData && onHover(e, dateStr, count)}
            onClick={(e) => hasData && onClick(e, dateStr)}
        />
    );
});

HeatmapCell.displayName = 'HeatmapCell';

export const Heatmap = memo(function Heatmap() {
    const [stats, setStats] = useState<HeatmapStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number; left: number; top: number; align: 'left' | 'center' | 'right' } | null>(null);
    const shouldReduceMotion = useReducedMotion();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeDate = searchParams.get('date');

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
    }, [stats?.firstMemoDate]);

    // 生成最近 12 周 (84 天) 的日期数据
    const heatmapDays = useMemo(() => {
        const today = startOfDay(new Date());
        const start = subDays(today, 83); // 12 weeks = 84 days
        return eachDayOfInterval({ start, end: today }).map(d => format(d, 'yyyy-MM-dd'));
    }, []);

    const handleCellHover = useCallback((e: React.MouseEvent | React.FocusEvent, date: string, count: number) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const container = target.closest('.heatmap-content-wrapper') as HTMLElement;

        if (container) {
            const containerRect = container.getBoundingClientRect();
            const relX = rect.left - containerRect.left + 7;
            const containerWidth = containerRect.width;

            let align: 'left' | 'center' | 'right' = 'center';
            if (relX < 60) align = 'left';
            else if (relX > containerWidth - 60) align = 'right';

            setHoveredDate({
                date,
                count,
                left: relX,
                top: rect.top - containerRect.top,
                align
            });
        }
    }, []);

    const handleCellClick = useCallback((e: React.MouseEvent, date: string) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/?date=${date}`);
    }, [router]);

    if (loading) {
        return (
            <div className="w-full space-y-4 py-4 px-2">
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-muted/20 animate-pulse rounded" />
                    ))}
                </div>
                <div className="h-32 bg-muted/10 animate-pulse rounded" />
            </div>
        );
    }

    // 顶栏统计 - 仅这部分触发 Modal
    const StatsTrigger = (
        <div className="grid grid-cols-3 gap-2 cursor-pointer group/stats hover:opacity-80 transition-opacity">
            <div className="flex flex-col items-center">
                <span className="text-3xl tracking-tight leading-none">{stats?.totalMemos || 0}</span>
                <span className="text-[11px] text-muted-foreground mt-1">笔记</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-3xl tracking-tight leading-none">{stats?.totalTags || 0}</span>
                <span className="text-[11px] text-muted-foreground mt-1">标签</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-3xl tracking-tight leading-none">{totalActiveDays}</span>
                <span className="text-[11px] text-muted-foreground mt-1">天</span>
            </div>
        </div>
    );

    return stats ? (
        <div className="w-full space-y-4 px-1 relative overflow-visible">
            {/* 顶栏统计 - 包裹在 HeatmapModal 中，点击打开 Modal */}
            <HeatmapModal stats={stats} trigger={StatsTrigger} />

            {/* 热力图主体 - 不触发 Modal，仅支持日期过滤 */}
            <div className="relative pt-2" onMouseLeave={() => setHoveredDate(null)}>
                <div className="relative overflow-visible heatmap-content-wrapper">
                    <div
                        className="grid grid-rows-7 grid-flow-col gap-[5px] justify-center"
                        style={{ gridTemplateRows: 'repeat(7, 14px)' }}
                    >
                        {heatmapDays.map((dateStr) => (
                            <HeatmapCell
                                key={dateStr}
                                dateStr={dateStr}
                                count={stats?.days[dateStr]?.count || 0}
                                isActive={activeDate === dateStr}
                                onHover={handleCellHover}
                                onClick={handleCellClick}
                                shouldReduceMotion={!!shouldReduceMotion}
                            />
                        ))}
                    </div>

                    {/* Tooltip */}
                    {hoveredDate && (
                        <div
                            className={cn(
                                "absolute z-[999] px-2.5 py-1.5 text-[10px] font-medium text-white bg-black/95 backdrop-blur-md rounded pointer-events-none mt-[-15px] animate-in fade-in zoom-in duration-150 shadow-2xl border border-white/20 whitespace-nowrap",
                                hoveredDate.align === 'center' && "-translate-x-1/2 -translate-y-full",
                                hoveredDate.align === 'left' && "-translate-y-full ml-[-7px]",
                                hoveredDate.align === 'right' && "-translate-x-full -translate-y-full mr-[-7px]"
                            )}
                            style={{ left: hoveredDate.left, top: hoveredDate.top }}
                        >
                            <span className="text-[#9be9a8] font-bold">{hoveredDate.count} 笔记</span>
                            <span className="mx-1.5 opacity-40">/</span>
                            <span>{hoveredDate.date}</span>
                        </div>
                    )}
                </div>

                {/* Month labels at bottom */}
                <div className="flex justify-between mt-2 px-1 text-[11px] text-muted-foreground font-medium opacity-60">
                    <span className="flex-1 text-center">十一月</span>
                    <span className="flex-1 text-center">十二月</span>
                    <span className="flex-1 text-center">一月</span>
                    <span className="flex-1 text-center">二月</span>
                </div>
            </div>
        </div>
    ) : null;
});
