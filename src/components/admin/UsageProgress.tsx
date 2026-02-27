"use client";

import { cn } from "@/lib/utils";

interface UsageProgressProps {
    label: string;
    used: number;
    limit: number | string;
    percentage: number;
    unit?: string;
    className?: string;
}

export function UsageProgress({
    label,
    used,
    limit,
    percentage,
    unit = "",
    className
}: UsageProgressProps) {
    // 根据百分比确定颜色
    const getColorClass = (pct: number) => {
        if (pct >= 90) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
        if (pct >= 70) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
        return "bg-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]";
    };

    const getBgColorClass = (pct: number) => {
        if (pct >= 90) return "bg-red-500/10";
        if (pct >= 70) return "bg-amber-500/10";
        return "bg-primary/10";
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                    <span className="text-sm font-medium text-foreground/80">{label}</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-semibold text-foreground">
                        {used}{unit}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
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
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-between items-center px-0.5">
                <span className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    percentage >= 90 ? "text-red-500" : percentage >= 70 ? "text-amber-500" : "text-muted-foreground"
                )}>
                    {percentage >= 90 ? "接近上限" : percentage >= 70 ? "监控中" : "正常"}
                </span>
                <span className="text-[11px] font-mono font-medium text-muted-foreground/70">
                    {percentage}%
                </span>
            </div>
        </div>
    );
}
