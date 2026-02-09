'use client';

import { Suspense, useState } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { TagCloud } from '../ui/TagCloud';
import { Heatmap } from '../ui/Heatmap';
import { OnThisDay } from '../ui/OnThisDay';
import { Home, Tag, Trash2, Image as GalleryIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { SidebarSettings } from "./SidebarSettings";

export function LeftSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { icon: <Home className="w-5 h-5" />, label: '首页', href: '/' },
        { icon: <GalleryIcon className="w-5 h-5" />, label: '画廊', href: '/gallery' },
        { icon: <Tag className="w-5 h-5" />, label: '标签', href: '/tags' },
        { icon: <Trash2 className="w-5 h-5" />, label: '回收站', href: '/trash' },
    ];

    return (
        <aside
            className={cn(
                "h-full flex flex-col border-r border-border bg-background/50 backdrop-blur-md transition-[width,padding,background-color] duration-300 ease-in-out group/sidebar",
                isCollapsed ? "w-20 p-4" : "w-72 p-6"
            )}
        >
            {/* SidebarSettings 移动到顶部 */}
            <div className={cn("mb-6", isCollapsed ? "pb-4" : "p-1")}>
                <SidebarSettings isCollapsed={isCollapsed} />
            </div>

            {/* Toggle 按钮保留在顶部下方 */}
            <div className={cn("flex items-center justify-start mb-4", isCollapsed && "flex-col gap-4")}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                    aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
                >
                    {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                </Button>
            </div>

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
                                "flex items-center gap-3 p-2.5 rounded-sm transition-all group overflow-hidden",
                                isCollapsed ? "justify-center" : "px-3",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent"
                            )}
                            title={item.label}
                        >
                            <span className={cn(
                                "transition-colors shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground"
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
                    <Tag className="w-3 h-3" /> 热门标签
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

        </aside>
    );
}
