"use client";

import { cn } from "@/lib/utils";

interface UsageProgressProps {
    label: string;
    used: number;
    limit: number | string;
    percentage: number;
    unit?: string;
    info?: string;
    muted?: boolean;
    className?: string;
}

export function UsageProgress({
    label,
    used,
    limit,
    percentage,
    unit = "",
    info,
    muted = false,
    className
}: UsageProgressProps) {
    // 根据百分比确定颜色
    const getColorClass = (pct: number) => {
        if (muted) return "bg-gray-300 shadow-none";
        if (pct >= 90) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
        if (pct >= 70) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
        return "bg-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]";
    };

    const getBgColorClass = (pct: number) => {
        if (muted) return "bg-gray-200/80";
        if (pct >= 90) return "bg-red-500/10";
        if (pct >= 70) return "bg-amber-500/10";
        return "bg-primary/10";
    };

    const statusText = muted ? "等待数据" : percentage >= 90 ? "接近上限" : percentage >= 70 ? "监控中" : "正常";
    const statusDotClass = muted ? "bg-gray-300" : percentage >= 90 ? "bg-red-500" : percentage >= 70 ? "bg-amber-500" : "bg-emerald-500";
    const statusTextClass = muted ? "text-gray-400" : percentage >= 90 ? "text-red-500" : percentage >= 70 ? "text-amber-500" : "text-muted-foreground";

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", muted ? "text-gray-400" : "text-foreground/80")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass)} />
                        <span>{label}</span>
                        {info && (
                            <span className="group relative inline-flex">
                                <button
                                    type="button"
                                    className={cn(
                                        "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
                                        muted
                                            ? "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
                                            : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                                    )}
                                    aria-label={`${label} 指标说明`}
                                >
                                    i
                                </button>
                                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 w-52 -translate-x-1/2 whitespace-normal break-words rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-medium leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                    {info}
                                </span>
                            </span>
                        )}
                    </span>
                </div>
                <div className="text-right">
                    <span className={cn("text-sm font-semibold tabular-nums", muted ? "text-gray-400" : "text-foreground")}>
                        {used}{unit}
                    </span>
                    <span className={cn("ml-1 text-xs", muted ? "text-gray-400" : "text-muted-foreground")}>
                        / {limit}{unit}
                    </span>
                </div>
            </div>

            <div className={cn("h-2 w-full rounded-full overflow-hidden relative", getBgColorClass(percentage))}>
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        getColorClass(percentage)
                    )}
                    style={{ width: `${muted ? 12 : percentage}%` }}
                />
            </div>

            <div className="flex justify-between items-center px-0.5">
                <span className={cn("text-[10px] font-medium uppercase tracking-wider", statusTextClass)}>
                    {statusText}
                </span>
                <span className={cn("text-[11px] font-mono font-medium", muted ? "text-gray-400" : "text-muted-foreground/70")}>
                    {percentage}%
                </span>
            </div>
        </div>
    );
}
