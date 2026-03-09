'use client';

import { Suspense, useState } from 'react';
import { TagCloud } from '../ui/TagCloud';
import { Heatmap } from '../ui/Heatmap';
import { OnThisDay } from '../ui/OnThisDay';
import { HugeiconsIcon } from '@hugeicons/react';
import { PanelLeftCloseIcon, PanelLeftOpenIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SidebarSettings } from "./SidebarSettings";
import { motion, Variants } from 'framer-motion';

import { Memo } from '@/types/memo';
import { useSidebarNavigation } from '@/hooks/useSidebarNavigation';
import { SidebarNavItem } from './sidebar/SidebarNavItem';
import { useHasMounted } from '@/hooks/useHasMounted';

export interface LeftSidebarProps {
    onClose?: () => void;
    initialOnThisDay?: Memo[];
}

export function LeftSidebar({ onClose, initialOnThisDay }: LeftSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isMobile = !!onClose;
    const effectiveIsCollapsed = isMobile ? false : isCollapsed;
    const hasMounted = useHasMounted();

    const {
        navItems,
        currentView,
        springY,
        scaleY,
        scaleX,
        handleNavigate
    } = useSidebarNavigation();

    const sidebarVariants: Variants = {
        expanded: { width: "18rem" },
        collapsed: { width: "5rem" }
    };

    const labelVariants: Variants = {
        expanded: { opacity: 1, width: "auto", x: 0, transition: { duration: 0.2 } },
        collapsed: { opacity: 0, width: 0, x: -10, transition: { duration: 0.1 } }
    };

    const navVariants: Variants = {
        expanded: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
        collapsed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
    };

    const navItemVariants: Variants = {
        expanded: { opacity: 1, x: 0 },
        collapsed: { opacity: 1, x: 0 }
    };

    const sectionVariants: Variants = {
        expanded: { opacity: 1, height: "auto", transition: { delay: 0.1, duration: 0.3 } },
        collapsed: { opacity: 0, height: 0, transition: { duration: 0.2 } }
    };

    return (
        <motion.aside
            initial={effectiveIsCollapsed ? "collapsed" : "expanded"}
            animate={effectiveIsCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={{ stiffness: 350, damping: 35, mass: 1 }}
            style={{ willChange: "width" }}
            className="h-full flex flex-col border-r border-border bg-background/50 backdrop-blur-md overflow-hidden group/sidebar relative p-2"
        >
            {/* Top Area */}
            <div className={cn("mb-[24px]", !effectiveIsCollapsed ? "flex items-center gap-1 pr-1" : "pb-2 flex flex-col gap-4")}>
                <div className="flex-1 min-w-0 h-9 overflow-hidden">
                    <SidebarSettings isCollapsed={effectiveIsCollapsed} />
                </div>
                <Button
                    variant="ghost"
                    onClick={() => isMobile ? onClose() : setIsCollapsed(!isCollapsed)}
                    className={cn("text-muted-foreground shrink-0 rounded transition-all active:scale-95", effectiveIsCollapsed ? "w-full justify-center h-9 p-2" : "h-8 w-8 px-0")}
                    asChild
                >
                    <motion.button>
                        {isMobile ? (
                            <HugeiconsIcon icon={Cancel01Icon} size={16} />
                        ) : (
                            effectiveIsCollapsed ? <HugeiconsIcon icon={PanelLeftOpenIcon} size={16} /> : <HugeiconsIcon icon={PanelLeftCloseIcon} size={16} />
                        )}
                    </motion.button>
                </Button>
            </div>

            {/* Heatmap Area */}
            <motion.div variants={sectionVariants} className="overflow-hidden mb-[24px] px-1 min-w-[17rem]">
                <Suspense fallback={<div className="h-40 w-full animate-pulse bg-muted/20 rounded" />}>
                    <div className={effectiveIsCollapsed ? "pointer-events-none" : ""}>
                        <Heatmap />
                    </div>
                </Suspense>
            </motion.div>

            {/* Navigation */}
            <motion.nav variants={navVariants} className="flex-1 px-1 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar mb-[24px] relative">
                {hasMounted && (
                    <motion.div
                        style={{ y: springY, scaleY, scaleX, opacity: 1, originY: 0.5 }}
                        className="absolute left-0 w-1 h-5 bg-primary rounded-full z-10"
                    />
                )}

                {navItems.map((item) => (
                    <SidebarNavItem
                        key={item.id}
                        item={item}
                        isActive={hasMounted && (item.href === '/' ? currentView === '/' : currentView.startsWith(item.href))}
                        isCollapsed={effectiveIsCollapsed}
                        onClick={(href) => handleNavigate(href, isMobile, onClose)}
                        labelVariants={labelVariants}
                        navItemVariants={navItemVariants}
                    />
                ))}
            </motion.nav>

            {/* Popular Tags */}
            <motion.div variants={sectionVariants} className="overflow-hidden mb-[24px] px-1 min-w-[17rem]">
                <h3 className="text-[24px] font-bold text-foreground leading-tight tracking-tight mb-4 flex items-center gap-2">热门标签</h3>
                <Suspense fallback={<div className="space-y-2"><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 w-12 bg-muted/20 rounded-full animate-pulse" />)}</div></div>}>
                    <TagCloud />
                </Suspense>
            </motion.div>

            {/* On This Day */}
            <motion.div variants={sectionVariants} className="overflow-hidden mb-[24px] px-1 min-w-[17rem]">
                <OnThisDay initialMemos={initialOnThisDay} />
            </motion.div>
        </motion.aside>
    );
}
