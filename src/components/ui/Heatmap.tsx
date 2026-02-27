'use client';

import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { getMemoStats } from '@/actions/stats';
import { startOfDay, subDays, format, eachDayOfInterval, differenceInDays, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { HeatmapModal } from './HeatmapModal';
import { useReducedMotion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

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

import { useStats } from '@/context/StatsContext';
import { HeatmapStats } from '@/types/stats';

export const Heatmap = memo(function Heatmap() {
    const { stats, isLoading: contextLoading, isMounted } = useStats();
    const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number; left: number; top: number; align: 'left' | 'center' | 'right' } | null>(null);
    const shouldReduceMotion = useReducedMotion();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeDate = searchParams.get('date');

    const loading = !isMounted || contextLoading;

    // 获取关键日期以计算
    const firstMemoDate = stats.firstMemoDate;

    // 计算总天数
    const totalActiveDays = useMemo(() => {
        if (!firstMemoDate) return 0;
        const parts = firstMemoDate.split('-');
        if (parts.length < 3) return 0;
        const firstDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return differenceInDays(new Date(), firstDate) + 1;
    }, [firstMemoDate]);

    // 生成对齐到周日的日期数据 (约 12-13 周)
    const heatmapDays = useMemo(() => {
        // 使用上海时区获取“今天”的起始时间
        const now = new Date();
        const today = startOfDay(now);

        // 计算约 12 周前的参考起点 (83天前)
        const candidateStart = subDays(today, 83);
        // 强制回退到该周的周日 (weekStartsOn: 0)，确保 grid 第一行始终是周日
        // 这样可以消除因一周起始日不固定导致的视觉错位
        const startDate = startOfWeek(candidateStart, { weekStartsOn: 0 });

        return eachDayOfInterval({ start: startDate, end: today }).map(d => format(d, 'yyyy-MM-dd'));
    }, []);

    // 动态计算月份标签及其所在列的索引
    const monthLabels = useMemo(() => {
        const labels: { name: string; colIndex: number }[] = [];
        let lastMonth = -1;

        heatmapDays.forEach((dateStr, index) => {
            const parts = dateStr.split('-');
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            const colIndex = Math.floor(index / 7);

            // 当发生跨月，且该日期位于该列的起始附近（为了标签靠左对齐）
            // 调整为 day <= 14 以适应因 startOfWeek 导致的宽范围对齐要求
            if (month !== lastMonth && (day <= 14)) {
                const dateObj = new Date(parseInt(parts[0]), month - 1, 1);
                const monthName = dateObj.toLocaleString('zh-CN', { month: 'short' });
                labels.push({ name: monthName, colIndex });
                lastMonth = month;
            }
        });
        return labels;
    }, [heatmapDays]);

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

    // If loading, stats will be null, and we'll use placeholder data
    const displayStats = stats || {
        totalMemos: 0,
        totalTags: 0,
        firstMemoDate: null,
        days: {}
    };

    const displayTotalActiveDays = stats ? totalActiveDays : 0;

    // 顶栏统计 - 仅这部分触发 Modal
    const StatsTrigger = (
        <div className={cn(
            "grid grid-cols-3 gap-2 transition-opacity",
            loading ? "cursor-default" : "cursor-pointer group/stats hover:opacity-80"
        )}>
            <div className="flex flex-col items-center">
                <span className="text-3xl tracking-tight leading-none font-bold font-mono tabular-nums">{displayStats.totalMemos}</span>
                <span className="text-[12px] font-normal text-stone-400 mt-1">笔记</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-3xl tracking-tight leading-none font-bold font-mono tabular-nums">{displayStats.totalTags}</span>
                <span className="text-[12px] font-normal text-stone-400 mt-1">标签</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-3xl tracking-tight leading-none font-bold font-mono tabular-nums">{displayTotalActiveDays}</span>
                <span className="text-[12px] font-normal text-stone-400 mt-1">天</span>
            </div>
        </div>
    );

    return (
        <div className="w-full space-y-4 px-1 relative overflow-visible">
            {/* 顶栏统计 - 加载时不响应点击 */}
            {loading ? (
                StatsTrigger
            ) : (
                <HeatmapModal stats={displayStats} trigger={StatsTrigger} />
            )}

            {/* 热力图主体 - 不触发 Modal，仅支持日期过滤 */}
            <div className="relative pt-2" onMouseLeave={() => setHoveredDate(null)}>
                <div className="relative overflow-visible heatmap-content-wrapper">
                    <div
                        className="grid grid-rows-7 grid-flow-col gap-[4px] justify-center"
                        style={{ gridTemplateRows: 'repeat(7, 14px)' }}
                    >
                        {heatmapDays.map((dateStr) => (
                            <HeatmapCell
                                key={dateStr}
                                dateStr={dateStr}
                                count={displayStats.days[dateStr]?.count || 0}
                                isActive={activeDate === dateStr}
                                onHover={handleCellHover}
                                onClick={handleCellClick}
                                shouldReduceMotion={!!shouldReduceMotion}
                            />
                        ))}
                    </div>

                    {/* Loading overlay for the grid if still counting animation is desired */}
                    {loading && (
                        <div className="absolute inset-0 bg-transparent animate-pulse pointer-events-none" />
                    )}

                    {/* Tooltip */}
                    {hoveredDate && (
                        <div
                            className={cn(
                                "absolute z-[999] px-2.5 py-1.5 text-[10px] font-mono text-white bg-black/95 backdrop-blur-md rounded pointer-events-none mt-[-15px] animate-in fade-in zoom-in duration-150 shadow-xl border border-white/20 whitespace-nowrap",
                                hoveredDate.align === 'center' && "-translate-x-1/2 -translate-y-full",
                                hoveredDate.align === 'left' && "-translate-y-full ml-[-7px]",
                                hoveredDate.align === 'right' && "-translate-x-full -translate-y-full mr-[-7px]"
                            )}
                            style={{ left: hoveredDate.left, top: hoveredDate.top }}
                        >
                            <span className="text-[#9be9a8] font-bold tabular-nums">{hoveredDate.count} 笔记</span>
                            <span className="mx-1.5 opacity-40">/</span>
                            <span className="tabular-nums">{hoveredDate.date}</span>
                        </div>
                    )}
                </div>

                {/* 月份标签 - 动态对齐 */}
                <div className="relative h-4 mt-2 text-[10px] text-stone-400 font-normal opacity-60 max-w-fit mx-auto">
                    {/* 这个容器需要与上面的 grid 宽度和居中逻辑保持一致 */}
                    <div
                        className="relative"
                        style={{
                            width: `${Math.ceil(heatmapDays.length / 7) * 18 - 4}px`
                        }}
                    >
                        {monthLabels.map(({ name, colIndex }, i) => (
                            <span
                                key={`${name}-${i}`}
                                className="absolute -translate-x-1"
                                style={{ left: `${colIndex * 18}px` }}
                            >
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});
