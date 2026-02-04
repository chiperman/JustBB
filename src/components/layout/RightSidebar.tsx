'use client';

import { useEffect, useState } from 'react';
import { getMemoStats } from '@/actions/stats';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export function RightSidebar() {
    const [years, setYears] = useState<{ year: number; months: number[] }[]>([]);
    const searchParams = useSearchParams();
    const currentYear = searchParams.get('year');
    const currentMonth = searchParams.get('month');

    useEffect(() => {
        getMemoStats().then((data) => {
            const yearMap = new Map<number, Set<number>>();

            Object.keys(data).forEach((dateStr) => {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const month = date.getMonth() + 1; // 1-12

                if (!yearMap.has(year)) {
                    yearMap.set(year, new Set());
                }
                yearMap.get(year)?.add(month);
            });

            // Convert to array and sort
            const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a).map(year => {
                return {
                    year,
                    months: Array.from(yearMap.get(year)!).sort((a, b) => b - a)
                };
            });

            setYears(sortedYears);
        });
    }, []);

    const monthNames = [
        '', '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];

    return (
        <aside className="hidden xl:flex w-80 h-screen sticky top-0 flex-col p-6 border-l border-border bg-background/50 backdrop-blur-md">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6 font-sans">
                    月份归档
                </h3>
                <div className="space-y-8">
                    {years.map((group) => (
                        <div key={group.year}>
                            <h4 className="text-lg font-bold mb-3">{group.year}</h4>
                            <div className="space-y-1 border-l border-border ml-2 pl-4">
                                {group.months.map((month) => {
                                    const isActive = currentYear === String(group.year) && currentMonth === String(month);
                                    return (
                                        <Link
                                            key={month}
                                            href={`/?year=${group.year}&month=${month}`}
                                            className={cn(
                                                "block text-sm transition-colors py-1",
                                                isActive
                                                    ? "text-primary font-medium"
                                                    : "text-muted-foreground hover:text-primary"
                                            )}
                                        >
                                            {monthNames[month]}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {years.length === 0 && (
                        <div className="text-sm text-muted-foreground">暂无归档数据</div>
                    )}
                </div>
            </div>
        </aside>
    );
}
