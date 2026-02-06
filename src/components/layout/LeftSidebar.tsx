'use client';

import { Suspense, useState } from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { FontToggle } from '../ui/FontToggle';
import { SearchInput } from '../ui/SearchInput';
import { TagCloud } from '../ui/TagCloud';
import { Heatmap } from '../ui/Heatmap';
import { OnThisDay } from '../ui/OnThisDay';
import { UserStatus } from '../ui/UserStatus';
import { Home, Tag, Trash2, Settings, Image as GalleryIcon, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LeftSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { icon: <Home className="w-5 h-5" aria-hidden="true" />, label: '首页', href: '/' },
        { icon: <GalleryIcon className="w-5 h-5" aria-hidden="true" />, label: '画廊', href: '/gallery' },
        { icon: <Tag className="w-5 h-5" aria-hidden="true" />, label: '标签', href: '/tags' },
        { icon: <Trash2 className="w-5 h-5" aria-hidden="true" />, label: '垃圾箱', href: '/trash' },
    ];

    return (
        <aside
            className={cn(
                "h-full flex flex-col border-r border-border bg-background/50 backdrop-blur-md transition-[width,padding,background-color] duration-300 ease-in-out group/sidebar",
                isCollapsed ? "w-20 p-4" : "w-72 p-6"
            )}
        >
            {/* Header with Toggle */}
            <div className={cn("flex items-center justify-between mb-8", isCollapsed && "flex-col gap-4")}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="overflow-hidden"
                    >
                        <h1 className="text-2xl font-bold tracking-tight text-primary">JustMemo</h1>
                        <p className="text-[10px] text-muted-foreground mt-0.5 tracking-[0.2em] font-sans opacity-70">FRAGMENTED MEMORY</p>
                    </motion.div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary shrink-0 cursor-pointer"
                    aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
                >
                    {isCollapsed ? <PanelLeftOpen className="w-5 h-5" aria-hidden="true" /> : <PanelLeftClose className="w-5 h-5" aria-hidden="true" />}
                </button>
            </div>

            <Suspense>
                <div className={cn("transition-all duration-300", isCollapsed ? "h-0 opacity-0 invisible overflow-hidden" : "h-auto opacity-100 visible mb-6")}>
                    <SearchInput />
                </div>
            </Suspense>

            <div className={cn("transition-all duration-300", isCollapsed ? "h-0 opacity-0 invisible overflow-hidden" : "h-auto opacity-100 visible mb-8 px-1")}>
                <Heatmap />
            </div>

            <nav className="flex-1 space-y-1.5 mb-6">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-all group overflow-hidden",
                            isCollapsed ? "justify-center" : "px-3"
                        )}
                        title={item.label}
                    >
                        <span className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                            {item.icon}
                        </span>
                        {!isCollapsed && (
                            <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                        )}
                    </Link>
                ))}
            </nav>

            <div className={cn("transition-all duration-300", isCollapsed ? "h-0 opacity-0 invisible overflow-hidden" : "h-auto opacity-100 visible mb-8")}>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 font-sans flex items-center gap-2">
                    <Tag className="w-3 h-3" aria-hidden="true" /> 热门标签
                </h3>
                <Suspense fallback={<div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-6 w-12 bg-muted/20 rounded-full animate-pulse" />
                        ))}
                    </div>
                </div>}>
                    <TagCloud />
                </Suspense>
            </div>

            <div className={cn("transition-all duration-300", isCollapsed ? "h-0 opacity-0 invisible overflow-hidden" : "h-auto opacity-100 visible mb-8")}>
                <OnThisDay />
            </div>

            <div className={cn("mt-auto pt-6 border-t border-border space-y-4", isCollapsed ? "flex flex-col items-center gap-6" : "")}>
                <UserStatus isCollapsed={isCollapsed} />

                {!isCollapsed && (
                    <>
                        <div className="flex items-center justify-between px-2">
                            <ThemeToggle />
                            <FontToggle />
                        </div>
                        <button
                            onClick={async () => {
                                if (!confirm('Download all memos as Markdown?')) return;
                                const { exportMemos } = await import('@/actions/export');
                                const data = await exportMemos('markdown');
                                const blob = new Blob([data], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `justbb_export_${new Date().toISOString().slice(0, 10)}.md`;
                                a.click();
                            }}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-all group w-full text-left cursor-pointer"
                            aria-label="导出数据"
                        >
                            <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" aria-hidden="true" />
                            <span className="text-sm font-medium">Export Data</span>
                        </button>
                    </>
                )}

                {isCollapsed && <ThemeToggle />}
            </div>
        </aside>
    );
}
