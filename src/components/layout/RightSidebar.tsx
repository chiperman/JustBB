'use client';

export function RightSidebar() {
    const months = [
        { year: 2026, months: ['一月'] },
        { year: 2025, months: ['十二月', '十一月', '十月', '九月', '八月', '七月', '六月', '五月', '四月', '三月', '二月', '一月'] },
    ];

    return (
        <aside className="w-80 h-screen sticky top-0 flex flex-col p-6 border-l border-border bg-background/50 backdrop-blur-md">
            <div className="mb-10">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 font-sans">
                    记录热力图
                </h3>
                <div className="h-32 bg-muted/30 rounded-lg border border-border dashed flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">此处接入热力图组件</span>
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6 font-sans">
                    月份归档
                </h3>
                <div className="space-y-8">
                    {months.map((group) => (
                        <div key={group.year}>
                            <h4 className="text-lg font-bold mb-3">{group.year}</h4>
                            <div className="space-y-2 border-l border-border ml-2 pl-4">
                                {group.months.map((month) => (
                                    <button
                                        key={month}
                                        className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                                    >
                                        {month}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
