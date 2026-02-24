import { useMemo, useState } from 'react';
import { format, eachMonthOfInterval, startOfYear, endOfYear, getYear } from 'date-fns';
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from '@hugeicons/react';
import { Share01Icon as Share } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

interface DayStats {
    count: number;
    wordCount: number;
}

interface YearlyStatsProps {
    stats: Record<string, DayStats>;
    firstMemoDate: string | null;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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

export function YearlyStats({ stats, firstMemoDate }: YearlyStatsProps) {
    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        if (!firstMemoDate) return [currentYear];
        const startYear = getYear(new Date(firstMemoDate));
        const years = [];
        for (let y = currentYear; y >= startYear; y--) {
            years.push(y);
        }
        return years;
    }, [firstMemoDate]);

    return (
        <motion.div
            className="flex flex-col gap-12"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {availableYears.map(year => (
                <motion.div key={year} variants={itemVariants}>
                    <YearlyStatsItem year={year} stats={stats} />
                </motion.div>
            ))}
        </motion.div>
    );
}

function YearlyStatsItem({ year, stats }: { year: number; stats: Record<string, DayStats> }) {
    const months = useMemo(() => {
        const start = startOfYear(new Date(year, 0, 1));
        const end = endOfYear(new Date(year, 0, 1));
        return eachMonthOfInterval({ start, end });
    }, [year]);

    const monthlyData = useMemo(() => {
        return months.map(month => {
            let memoCount = 0;
            let wordCount = 0;
            let activeDays = 0;

            const monthStr = format(month, 'yyyy-MM');
            Object.entries(stats).forEach(([date, dayStat]) => {
                if (date.startsWith(monthStr)) {
                    memoCount += dayStat.count;
                    wordCount += dayStat.wordCount;
                    if (dayStat.count > 0) activeDays += 1;
                }
            });

            return {
                monthLabel: format(month, 'MM'),
                memoCount,
                wordCount,
                activeDays
            };
        });
    }, [months, stats]);

    const totals = useMemo(() => {
        return monthlyData.reduce((acc, curr) => ({
            memos: acc.memos + curr.memoCount,
            words: acc.words + curr.wordCount,
            days: acc.days + curr.activeDays
        }), { memos: 0, words: 0, days: 0 });
    }, [monthlyData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight">{year}</h2>
                </div>
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <HugeiconsIcon icon={Share} size={16} className="text-muted-foreground" />
                </button>
            </div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="条笔记"
                        total={totals.memos}
                        data={monthlyData.map(d => d.memoCount)}
                        color="bg-[#4F46E5]" // Indigo-600
                        maxScale={30}
                        labels={monthlyData.map(d => d.monthLabel)}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="字"
                        total={totals.words}
                        data={monthlyData.map(d => d.wordCount)}
                        color="bg-[#10B981]" // Emerald-500
                        maxScale={100}
                        labels={monthlyData.map(d => d.monthLabel)}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="天"
                        total={totals.days}
                        data={monthlyData.map(d => d.activeDays)}
                        color="bg-[#EF4444]" // Red-500
                        maxScale={2}
                        labels={monthlyData.map(d => d.monthLabel)}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}

function StatCard({
    title,
    total,
    data,
    color,
    maxScale,
    labels,
}: {
    title: string;
    total: number;
    data: number[];
    color: string;
    maxScale: number;
    labels: string[];
}) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const maxValue = Math.max(...data, maxScale);

    // Dynamic Y-axis ticks calculation
    const ticks = useMemo(() => {
        // Target roughly 5-6 ticks
        const roughStep = maxValue / 5;
        // Round to nice numbers (1, 2, 5, 10, 20, 50, 100, etc.)
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;

        let step;
        if (normalizedStep < 1.5) step = 1 * magnitude;
        else if (normalizedStep < 3) step = 2 * magnitude;
        else if (normalizedStep < 7) step = 5 * magnitude;
        else step = 10 * magnitude;

        // Ensure step is at least 1
        step = Math.max(step, 1);

        const t = [];
        // Generate ticks up to a value slightly larger than maxValue if needed, 
        // to ensure the top bar doesn't touch the ceiling
        const topTick = Math.ceil(maxValue / step) * step;

        for (let i = 0; i <= topTick; i += step) {
            t.push(i);
        }
        return t.reverse();
    }, [maxValue]);

    // Use the top tick as the scale domain for rendering bars
    const currentScale = ticks[0] || maxValue;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-6 h-[280px] relative">
            <div className="flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-bold tracking-tight">{total}</span>
                <span className="text-sm font-bold text-foreground/80 font-sans tracking-normal">{title}</span>
            </div>

            <div
                className="flex-1 flex flex-col relative pt-2 pr-6 group/chart"
                onMouseLeave={() => setHoveredIdx(null)}
            >
                {/* Plot Area - Explicitly separated from labels to ensure geometry match */}
                <div className="flex-1 relative w-full mb-[24px]">
                    {/* Y-axis Ticks Layer */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {ticks.map((tick, i) => (
                            <div key={tick} className="flex items-center w-full h-[1px] relative">
                                <div className="flex-1" />
                                <span className="text-[10px] text-muted-foreground/40 font-mono font-medium absolute right-[-32px] w-[28px] text-left tabular-nums">
                                    {tick}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Bars Container */}
                    <div className="absolute inset-0 flex items-end justify-between gap-0 z-10">
                        {data.map((val, i) => {
                            const height = currentScale > 0 ? (val / currentScale) * 100 : 0;

                            return (
                                <div
                                    key={i}
                                    className="flex-1 h-full flex items-end justify-center relative group"
                                    onMouseEnter={() => setHoveredIdx(i)}
                                >
                                    {/* Track (Background) - Hidden by default, visible on hover */}
                                    <div className="absolute inset-x-0 bottom-0 top-0 w-[90%] mx-auto bg-black/[0.03] rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                                    {/* Bar */}
                                    <motion.div
                                        className={cn(
                                            "w-[90%] rounded-md relative z-10",
                                            color,
                                            val === 0 ? "opacity-0" : "opacity-80 group-hover:opacity-100"
                                        )}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} // smooth easeOutCubic
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Singleton Tooltip */}
                    <div
                        className={cn(
                            "absolute top-[30%] -translate-x-1/2 -translate-y-full mb-2 bg-white shadow-md rounded-md p-3 border border-black/5 z-30 min-w-[90px] pointer-events-none transition-all duration-300 ease-out",
                            hoveredIdx !== null ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        )}
                        style={{
                            left: hoveredIdx !== null ? `${((hoveredIdx + 0.5) / data.length) * 100}%` : '50%'
                        }}
                    >
                        <div className="text-[11px] text-muted-foreground mb-1 leading-none whitespace-nowrap font-mono">
                            {hoveredIdx !== null ? labels[hoveredIdx] : ''}月
                        </div>
                        <div className="text-sm font-bold leading-none whitespace-nowrap font-mono">
                            {hoveredIdx !== null ? data[hoveredIdx] : 0}{title.includes('条') ? '条笔记' : title}
                        </div>
                    </div>
                </div>

                {/* X-axis Labels - Outside plot area */}
                <div className="absolute bottom-0 left-0 right-0 h-[24px] flex items-center justify-between gap-0 pr-6">
                    {labels.map((label, i) => (
                        <div key={i} className="flex-1 text-center">
                            <span className={cn(
                                "text-[10px] font-mono font-medium transition-colors tabular-nums",
                                hoveredIdx === i ? "text-foreground/70" : "text-muted-foreground/40"
                            )}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
