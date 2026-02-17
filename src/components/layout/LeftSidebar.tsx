'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
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
import { getCurrentUser } from '@/actions/auth';

export interface LeftSidebarProps {
    onClose?: () => void;
}

export function LeftSidebar({ onClose }: LeftSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);


    useEffect(() => {
        const checkRole = async () => {
            const user = await getCurrentUser();
            setIsAdmin(user?.role === 'admin');
        };
        checkRole();
    }, []);

    const isMobile = !!onClose;
    const effectiveIsCollapsed = isMobile ? false : isCollapsed;

    const springConfig = {
        stiffness: 350,
        damping: 35,
        mass: 1
    };

    // 雅致流动模型 (Refined Liquid Model) - Activity Indicator
    // 同步使用统一的 Spring 配置
    const y = useMotionValue(0);
    const springY = useSpring(y, springConfig);

    // 捕获速度并映射为克制的形变比例
    const velocity = useVelocity(springY);
    // 移动时轻微拉长（scaleY 1.3），轻微变细（scaleX 0.9）
    const scaleY = useTransform(velocity, [-1200, 0, 1200], [1.3, 1, 1.3]);
    const scaleX = useTransform(velocity, [-1200, 0, 1200], [0.9, 1, 0.9]);
    const opacity = useTransform(springY, [-100, 0, 1000], [0, 1, 1]);

    const navItems = useMemo(() => {
        const items = [
            { icon: <Home className="size-4" />, label: '首页', href: '/' },
            { icon: <GalleryIcon className="size-4" />, label: '画廊', href: '/gallery' },
            { icon: <Tag className="size-4" />, label: '标签', href: '/tags' },
        ];

        if (isAdmin) {
            items.push({ icon: <Trash2 className="size-4" />, label: '回收站', href: '/trash' });
        }

        return items;
    }, [isAdmin]);

    // 同步外部路由变化到物理引擎
    useEffect(() => {
        const index = navItems.findIndex(item =>
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        );
        if (index !== -1) {
            y.set(index * 40 + 8);
        }
    }, [pathname, navItems, y]);

    const handleItemClick = (href: string) => {
        const index = navItems.findIndex(item => item.href === href);
        if (index !== -1) {
            y.set(index * 40 + 8);
        }
        if (isMobile) onClose();
    };

    const handleToggle = () => {
        if (isMobile) {
            onClose();
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    // 动画变体配置
    const sidebarVariants = {
        expanded: { width: "18rem" }, // w-72
        collapsed: { width: "5rem" }  // w-20
    };

    const labelVariants = {
        expanded: {
            opacity: 1,
            width: "auto",
            x: 0,
            transition: { duration: 0.2 }
        },
        collapsed: {
            opacity: 0,
            width: 0,
            x: -10,
            transition: { duration: 0.1 }
        }
    };

    const navVariants = {
        expanded: {
            transition: { staggerChildren: 0.07, delayChildren: 0.1 }
        },
        collapsed: {
            transition: { staggerChildren: 0.05, staggerDirection: -1 }
        }
    };

    const navItemVariants = {
        expanded: { opacity: 1, x: 0 },
        collapsed: { opacity: 1, x: 0 }
    };

    const sectionVariants = {
        expanded: {
            opacity: 1,
            height: "auto",
            transition: { delay: 0.1, duration: 0.3 }
        },
        collapsed: {
            opacity: 0,
            height: 0,
            transition: { duration: 0.2 }
        }
    };

    return (
        <motion.aside
            initial={effectiveIsCollapsed ? "collapsed" : "expanded"}
            animate={effectiveIsCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={springConfig}
            style={{ willChange: "width" }}
            className={cn(
                "h-full flex flex-col border-r border-border bg-background/50 backdrop-blur-md overflow-hidden group/sidebar relative",
                // 移除 CSS transition 类，移除 w- 类（由 motion 控制）
                // 保持 padding
                effectiveIsCollapsed ? "p-2" : "p-2"
            )}
        >

            {/* Top Area: Settings + Toggle */}
            <div className={cn(
                "mb-[24px]",
                !effectiveIsCollapsed ? "flex items-center gap-1 pr-1" : "pb-2 flex flex-col gap-4"
            )}>
                <div className="flex-1 min-w-0 h-9 overflow-hidden">
                    <SidebarSettings
                        isCollapsed={effectiveIsCollapsed}
                    />
                </div>
                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    onClick={handleToggle}
                    className={cn(
                        "text-muted-foreground hover:text-primary shrink-0 rounded-sm transition-colors",
                        // 使用 layout 属性处理位置变化，减少 CSS 类突变
                        effectiveIsCollapsed ? "w-full justify-center h-9 p-2" : "h-8 w-8 px-0"
                    )}
                    aria-label={isMobile ? "关闭侧边栏" : (effectiveIsCollapsed ? "展开侧边栏" : "收起侧边栏")}
                    asChild
                >
                    <motion.button>
                        {isMobile ? (
                            <PanelLeftClose className="size-4" />
                        ) : (
                            effectiveIsCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />
                        )}
                    </motion.button>
                </Button>
            </div>

            {/* Heatmap Area */}
            <motion.div
                variants={sectionVariants}
                className="overflow-hidden mb-[24px] px-1 min-w-[17rem]"
            >
                <Suspense fallback={<div className="h-40 w-full animate-pulse bg-muted/20 rounded-sm" />}>
                    {/* 使用 key 强制重新渲染或保持状态，视需求而定。这里直接渲染 */}
                    <div className={effectiveIsCollapsed ? "pointer-events-none" : ""}>
                        <Heatmap />
                    </div>
                </Suspense>
            </motion.div>

            {/* Navigation */}
            <motion.nav
                variants={navVariants}
                className="flex-1 px-1 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar mb-[24px] relative"
            >
                {/* Active Indicator */}
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
                        ? pathname === '/'
                        : pathname.startsWith(item.href);

                    return (
                        <motion.div variants={navItemVariants} key={item.label}>
                            <Link
                                href={item.href}
                                onClick={() => handleItemClick(item.href)}
                                className={cn(
                                    "flex items-center p-2 h-9 rounded-sm transition-colors group relative hover:bg-accent hover:text-accent-foreground",
                                    effectiveIsCollapsed ? "justify-center gap-0" : "px-3 gap-3",
                                    isActive
                                        ? "text-primary font-medium"
                                        : "text-muted-foreground"
                                )}
                                title={item.label}
                            >
                                <span className={cn(
                                    "transition-colors shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {item.icon}
                                </span>

                                <motion.span
                                    variants={labelVariants}
                                    className="text-[14px] font-normal whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.nav>

            {/* Popular Tags */}
            <motion.div
                variants={sectionVariants}
                className="overflow-hidden mb-[24px] px-1 min-w-[17rem]"
            >
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
            </motion.div>

            {/* On This Day */}
            <motion.div
                variants={sectionVariants}
                className="overflow-hidden mb-[24px] px-1 min-w-[17rem]"
            >
                <OnThisDay />
            </motion.div>

        </motion.aside>
    );
}
