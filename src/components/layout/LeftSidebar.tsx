'use client';

import { Suspense, useSyncExternalStore } from 'react';
import { TagCloud } from '../ui/TagCloud';
import { Heatmap } from '../ui/Heatmap';
import { HugeiconsIcon } from '@hugeicons/react';
import { PanelLeftCloseIcon, PanelLeftOpenIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SidebarSettings } from "./SidebarSettings";
import { AnimatePresence, motion } from 'framer-motion';


import { useSidebarNavigation } from '@/hooks/useSidebarNavigation';
import { SidebarNavItem } from './sidebar/SidebarNavItem';
import { useHasMounted } from '@/hooks/useHasMounted';

export interface LeftSidebarProps {
    onClose?: () => void;
}

const SIDEBAR_EXPANDED_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 88;
const SIDEBAR_TRANSITION = {
    duration: 0.28,
    ease: [0.22, 1, 0.36, 1] as const
};
const CONTENT_FADE_TRANSITION = {
    duration: 0.14,
    ease: [0.4, 0, 0.2, 1] as const
};
const HEATMAP_SLOT_HEIGHT = 248;
const TAGS_SLOT_HEIGHT = 176;
const LEFT_SIDEBAR_STORAGE_KEY = 'layout:left-sidebar-collapsed';
const LEFT_SIDEBAR_STORAGE_EVENT = 'layout:left-sidebar-collapsed-change';

function getStoredLeftSidebarCollapsed() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LEFT_SIDEBAR_STORAGE_KEY) === 'true';
}

export function LeftSidebar({ onClose }: LeftSidebarProps) {
    const isMobile = !!onClose;
    const isCollapsed = useSyncExternalStore(
        (onStoreChange) => {
            if (typeof window === 'undefined') return () => {};

            const handleStorage = (event: StorageEvent) => {
                if (event.key === LEFT_SIDEBAR_STORAGE_KEY) {
                    onStoreChange();
                }
            };

            const handleLocalChange = () => onStoreChange();

            window.addEventListener('storage', handleStorage);
            window.addEventListener(LEFT_SIDEBAR_STORAGE_EVENT, handleLocalChange);

            return () => {
                window.removeEventListener('storage', handleStorage);
                window.removeEventListener(LEFT_SIDEBAR_STORAGE_EVENT, handleLocalChange);
            };
        },
        getStoredLeftSidebarCollapsed,
        () => false,
    );
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

    const toggleCollapsedState = () => {
        if (isMobile) {
            onClose?.();
            return;
        }

        const nextCollapsed = !isCollapsed;
        localStorage.setItem(LEFT_SIDEBAR_STORAGE_KEY, String(nextCollapsed));
        window.dispatchEvent(new Event(LEFT_SIDEBAR_STORAGE_EVENT));
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: effectiveIsCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
            transition={SIDEBAR_TRANSITION}
            style={{ willChange: "width" }}
            className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-background/50 p-2 backdrop-blur-md"
        >
            {/* Top Area */}
            <motion.div
                layout
                transition={SIDEBAR_TRANSITION}
                className={cn(
                    "transition-[padding,gap,margin] duration-200",
                    effectiveIsCollapsed ? "mb-4 flex flex-col items-center gap-1.5" : "mb-5 flex items-center gap-1 pr-1"
                )}
            >
                <div className={cn("h-9 overflow-hidden", effectiveIsCollapsed ? "w-9 min-w-9" : "flex-1 min-w-0")}>
                    <SidebarSettings isCollapsed={effectiveIsCollapsed} />
                </div>
                <Button
                    variant="ghost"
                    onClick={toggleCollapsedState}
                    className="h-8 w-8 shrink-0 rounded px-0 text-muted-foreground transition-all active:scale-95"
                    asChild
                >
                    <motion.button
                        layout
                        transition={SIDEBAR_TRANSITION}
                    >
                        <motion.span
                            key={isMobile ? 'mobile-close' : effectiveIsCollapsed ? 'expand' : 'collapse'}
                            initial={{ opacity: 0, rotate: -16, scale: 0.92 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-center justify-center"
                        >
                        {isMobile ? (
                            <HugeiconsIcon icon={Cancel01Icon} size={16} />
                        ) : (
                            effectiveIsCollapsed ? <HugeiconsIcon icon={PanelLeftOpenIcon} size={16} /> : <HugeiconsIcon icon={PanelLeftCloseIcon} size={16} />
                        )}
                        </motion.span>
                    </motion.button>
                </Button>
            </motion.div>

            {/* Heatmap Area */}
            <motion.div
                layout
                transition={SIDEBAR_TRANSITION}
                className={cn(
                    "shrink-0 overflow-hidden px-1",
                    effectiveIsCollapsed ? "mb-0" : "mb-5"
                )}
                animate={{ height: effectiveIsCollapsed ? 0 : HEATMAP_SLOT_HEIGHT, opacity: effectiveIsCollapsed ? 0 : 1 }}
            >
                <AnimatePresence initial={false} mode="popLayout">
                    {!effectiveIsCollapsed && (
                        <motion.div
                            key="heatmap"
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={CONTENT_FADE_TRANSITION}
                            className="h-full"
                        >
                            <Suspense fallback={<div className="h-40 w-full animate-pulse rounded bg-muted/20" />}>
                                <Heatmap />
                            </Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Navigation */}
            <motion.nav
                layout
                transition={SIDEBAR_TRANSITION}
                className={cn(
                    "relative min-h-0 flex-1 overflow-x-hidden px-1 pb-4 custom-scrollbar",
                    effectiveIsCollapsed ? "overflow-y-hidden" : "overflow-y-auto"
                )}
            >
                <motion.div
                    layout
                    transition={SIDEBAR_TRANSITION}
                    className={cn(
                        "mb-3 border-t border-border/60",
                        effectiveIsCollapsed ? "mx-1" : "mx-2"
                    )}
                />

                {hasMounted && !effectiveIsCollapsed && (
                    <motion.div
                        style={{ y: springY, scaleY, scaleX, originY: 0.5 }}
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
                    />
                ))}
            </motion.nav>

            {/* Popular Tags */}
            <motion.div
                layout
                transition={SIDEBAR_TRANSITION}
                className="mt-auto shrink-0 overflow-hidden"
                animate={{ height: effectiveIsCollapsed ? 0 : TAGS_SLOT_HEIGHT, opacity: effectiveIsCollapsed ? 0 : 1 }}
            >
                <AnimatePresence initial={false} mode="popLayout">
                    {!effectiveIsCollapsed && (
                        <motion.div
                            key="popular-tags"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={CONTENT_FADE_TRANSITION}
                            className="h-full border-t border-border/60 bg-background/80 px-1 pt-4 pb-1 backdrop-blur-sm"
                        >
                            <h3 className="mb-4 flex items-center gap-2 text-[24px] leading-tight font-bold tracking-tight text-foreground">热门标签</h3>
                            <Suspense fallback={<div className="space-y-2"><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 w-12 rounded-full bg-muted/20 animate-pulse" />)}</div></div>}>
                                <TagCloud />
                            </Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.aside>
    );
}
