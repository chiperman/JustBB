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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { usePathname } from 'next/navigation';

export function LeftSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { icon: <Home className="w-5 h-5" aria-hidden="true" />, label: '首页', href: '/' },
        { icon: <GalleryIcon className="w-5 h-5" aria-hidden="true" />, label: '画廊', href: '/gallery' },
        { icon: <Tag className="w-5 h-5" aria-hidden="true" />, label: '标签', href: '/tags' },
        { icon: <Trash2 className="w-5 h-5" aria-hidden="true" />, label: '回收站', href: '/trash' },
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
                <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                    <h1 className="text-2xl font-bold tracking-tight text-primary whitespace-nowrap">JustMemo</h1>
                    <p className="text-[10px] text-muted-foreground mt-0.5 tracking-[0.2em] font-sans opacity-70 whitespace-nowrap">FRAGMENTED MEMORY</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                    aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
                >
                    {isCollapsed ? <PanelLeftOpen className="w-5 h-5" aria-hidden="true" /> : <PanelLeftClose className="w-5 h-5" aria-hidden="true" />}
                </Button>
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
                {navItems.map((item) => {
                    const isActive = item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg transition-all group overflow-hidden",
                                isCollapsed ? "justify-center" : "px-3",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                            )}
                            title={item.label}
                        >
                            <span className={cn(
                                "transition-colors shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                            )}>
                                {item.icon}
                            </span>
                            <span className={cn(
                                "text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                            )}>{item.label}</span>
                        </Link>
                    );
                })}
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

                <div className={cn(
                    "transition-all duration-300 overflow-hidden",
                    isCollapsed ? "max-h-0 opacity-0" : "max-h-40 opacity-100"
                )}>
                    <div className="flex items-center justify-between px-2 mb-4">
                        <ThemeToggle />
                        <FontToggle />
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center justify-start gap-3 h-auto py-2.5 px-2.5 w-full hover:bg-muted font-normal"
                                aria-label="导出数据"
                            >
                                <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" aria-hidden="true" />
                                <span className="text-sm font-medium">导出数据 (MD)</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>确认导出数据？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    系统将处理所有记录并生成一个 Markdown 格式的备份文件供你下载。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                    const { exportMemos } = await import('@/actions/export');
                                    const data = await exportMemos('markdown');
                                    const blob = new Blob([data], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `justbb_export_${new Date().toISOString().slice(0, 10)}.md`;
                                    a.click();
                                }}>
                                    确认导出
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {isCollapsed && <ThemeToggle />}
            </div>
        </aside>
    );
}
