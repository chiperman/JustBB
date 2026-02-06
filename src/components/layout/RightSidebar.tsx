import { useEffect, useState } from 'react';
import { getMemoStats } from '@/actions/stats';
import {
    Timeline,
    TimelineContent,
    TimelineDot,
    TimelineHeading,
    TimelineItem
} from '@/components/ui/timeline';

export function RightSidebar() {
    const [timeline, setTimeline] = useState<{
        year: number;
        months: {
            month: number;
            days: number[];
        }[];
    }[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        getMemoStats().then((data) => {
            const structure = new Map<number, Map<number, Set<number>>>();

            Object.keys(data.days).forEach((dateStr) => {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();

                if (isNaN(year)) return;

                if (!structure.has(year)) {
                    structure.set(year, new Map());
                }
                const yearMap = structure.get(year)!;

                if (!yearMap.has(month)) {
                    yearMap.set(month, new Set());
                }
                yearMap.get(month)?.add(day);
            });

            // Convert to sorted array
            const sortedTimeline = Array.from(structure.keys())
                .sort((a, b) => b - a)
                .map(year => {
                    const yearMap = structure.get(year)!;
                    const months = Array.from(yearMap.keys())
                        .sort((a, b) => b - a)
                        .map(month => ({
                            month,
                            days: Array.from(yearMap.get(month)!).sort((a, b) => b - a)
                        }));
                    return { year, months };
                });

            setTimeline(sortedTimeline);
        });
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-10% 0px -80% 0px', // Trigger when element is near top
                threshold: 0
            }
        );

        // Disconnect previous observation
        observer.disconnect();

        // Observe all date anchors
        document.querySelectorAll('[id^="date-"]').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, [timeline]); // Re-run when timeline data loads (and DOM nodes exist)

    const monthNames = [
        '', '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];

    const cn = (...classes: (string | undefined | null | false)[]) => {
        return classes.filter(Boolean).join(' ');
    };

    return (
        <aside className="hidden xl:flex w-80 h-full flex-col p-6 border-l border-border bg-background/50 backdrop-blur-md">
            <div className="flex-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6 font-sans">
                    时间轴
                </h3>
                <Timeline>
                    {timeline.map((yearGroup) => (
                        <TimelineItem key={yearGroup.year}>
                            <TimelineDot />
                            <TimelineHeading>
                                <a
                                    href={`#year-${yearGroup.year}`}
                                    className="hover:text-primary transition-colors cursor-pointer"
                                    onClick={() => setActiveId(`year-${yearGroup.year}`)}
                                >
                                    {yearGroup.year}
                                </a>
                            </TimelineHeading>
                            <TimelineContent>
                                {yearGroup.months.map((monthGroup) => (
                                    <div key={monthGroup.month} className="relative">
                                        <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                            <a
                                                href={`#month-${yearGroup.year}-${monthGroup.month}`}
                                                className="hover:text-primary transition-colors cursor-pointer"
                                                onClick={() => setActiveId(`month-${yearGroup.year}-${monthGroup.month}`)}
                                            >
                                                {monthNames[monthGroup.month]}
                                            </a>
                                        </h5>
                                        <div className="flex flex-col gap-1">
                                            {monthGroup.days.map((day) => {
                                                const dateStr = `${yearGroup.year}-${String(monthGroup.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const linkId = `date-${dateStr}`;
                                                const isActive = activeId === linkId;

                                                return (
                                                    <a
                                                        key={day}
                                                        href={`#${linkId}`}
                                                        className={cn(
                                                            "text-xs transition-colors block py-0.5 pl-2 border-l-2 -ml-[17px] cursor-pointer",
                                                            isActive
                                                                ? "border-primary text-primary font-medium"
                                                                : "border-transparent text-muted-foreground/60 hover:text-primary"
                                                        )}
                                                        onClick={() => setActiveId(linkId)}
                                                    >
                                                        {day}日
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                    {timeline.length === 0 && (
                        <div className="text-sm text-muted-foreground pl-2">Empty Timeline</div>
                    )}
                </Timeline>
            </div>
        </aside>
    );
}
