'use client';

import { Suspense, useState, useEffect } from 'react';
import { TagCloud } from '../ui/TagCloud';
import { Heatmap } from '../ui/Heatmap';
import { OnThisDay } from '../ui/OnThisDay';
import { Home, Tag, Trash2, Image as GalleryIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { SidebarSettings } from "./SidebarSettings";
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion';

export interface LeftSidebarProps {
    onClose?: () => void;
}

export function LeftSidebar({ onClose }: LeftSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const [activeHref, setActiveHref] = useState(pathname);

    const isMobile = !!onClose;
    const effectiveIsCollapsed = isMobile ? false : isCollapsed;

    // 极致果冻动力学 (Ultra-Jelly Kinetics)
    const y = useMotionValue(0);
    const springY = useSpring(y, {
        stiffness: 600,
        damping: 12,
        mass: 0.5
    });

    // 捕获速度并映射为“体积守恒”拉伸比例
    const velocity = useVelocity(springY);
    const scaleY = useTransform(velocity, [-1200, 0, 1200], [2.2, 1, 2.2]);
    const scaleX = useTransform(velocity, [-1200, 0, 1200], [0.4, 1, 0.4]);
    const opacity = useTransform(springY, [-100, 0, 1000], [0, 1, 1]);

    // 同步外部路由变化到本地状态和物理引擎
    useEffect(() => {
        setActiveHref(pathname);
        const index = navItems.findIndex(item =>
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        );
        if (index !== -1) {
            y.set(index * 40 + 8);
        }
    }, [pathname]);

    const handleItemClick = (href: string) => {
        setActiveHref(href);
        const index = navItems.findIndex(item => item.href === href);
        if (index !== -1) {
            y.set(index * 40 + 8);
        }
        if (isMobile) onClose();
    };

    const navItems = [
        { icon: <Home className="w-5 h-5" />, label: '首页', href: '/' },
        { icon: <GalleryIcon className="w-5 h-5" />, label: '画廊', href: '/gallery' },
        { icon: <Tag className="w-5 h-5" />, label: '标签', href: '/tags' },
        { icon: <Trash2 className="w-5 h-5" />, label: '回收站', href: '/trash' },
    ];

    const handleToggle = () => {
        if (isMobile) {
            onClose();
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    return (
        <aside
            className={cn(
                "h-full flex flex-col border-r border-border bg-background/50 backdrop-blur-md transition-[width,padding,background-color] duration-300 ease-in-out group/sidebar",
                effectiveIsCollapsed ? "w-20 p-2" : "w-72 p-2"
            )}
        >
            {/* SidebarSettings 移动到顶部 */}
            <div className={cn("mb-[24px]", effectiveIsCollapsed ? "pb-2" : "p-0")}>
                <SidebarSettings isCollapsed={effectiveIsCollapsed} />
            </div>

            {/* Toggle 按钮保留在顶部下方 */}
            <div className={cn("flex items-center justify-start mb-[24px]", effectiveIsCollapsed && "flex-col gap-4 px-1")}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggle}
                    className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0 rounded-sm"
                    aria-label={isMobile ? "关闭侧边栏" : (effectiveIsCollapsed ? "展开侧边栏" : "收起侧边栏")}
                >
                    {isMobile ? (
                        <PanelLeftClose className="w-5 h-5" />
                    ) : (
                        effectiveIsCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />
                    )}
                </Button>
            </div>

            <div className={cn("transition-all duration-300", effectiveIsCollapsed ? "h-0 opacity-0 invisible overflow-hidden" : "h-auto opacity-100 visible mb-[24px] px-1")}>
                <Suspense fallback={<div className="h-40 w-full animate-pulse bg-muted/20 rounded-sm" />}>
                    <Heatmap />
                </Suspense>
            </div>

            <nav className="flex-1 px-1 space-y-1 overflow-y-auto custom-scrollbar mb-[24px] relative">
                <motion.div
                    style={{
                        y: springY,
                        scaleY,
                        scaleX,
                        opacity,
                        originY: 0.5
                    }}
                    className="absolute left-0 w-1 h-5 bg-primary rounded-full z-10"
                />

                {navItems.map((item) => {
                    const isActive = item.href === '/'
                        ? activeHref === '/'
                        : activeHref.startsWith(item.href);

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => handleItemClick(item.href)}
                            className={cn(
                                "flex items-center gap-3 p-2 h-9 rounded-sm transition-all group relative", // 固定高度 h-9 (36px)
                                effectiveIsCollapsed ? "justify-center" : "px-3",
                                isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:bg-stone-50/50 dark:hover:bg-stone-900/50"
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
                                "text-[14px] font-normal whitespace-nowrap transition-all duration-300",
                                effectiveIsCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                            )}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={cn("transition-all duration-300", effectiveIsCollapsed ? "h-0 opacity-0 invisible overflow-hidden" : "h-auto opacity-100 visible mb-[24px] px-1")}>
                <h3 className="text-[24px] font-bold text-foreground leading-tight tracking-tight mb-4 flex items-center gap-2">
                    热门标签
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

            <div className={cn("transition-all duration-300", effectiveIsCollapsed ? "h-0 opacity-0 invisible overflow-hidden" : "h-auto opacity-100 visible mb-[24px] px-1")}>
                <OnThisDay />
            </div>

        </aside>
    );
}
