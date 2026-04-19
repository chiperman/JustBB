'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { NavigationItem } from '@/config/navigation';

const LABEL_TRANSITION = {
    duration: 0.18,
    ease: [0.4, 0, 0.2, 1] as const
};

interface SidebarNavItemProps {
    item: NavigationItem;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: (href: string) => void;
}

export function SidebarNavItem({
    item,
    isActive,
    isCollapsed,
    onClick
}: SidebarNavItemProps) {
    return (
        <motion.div layout="position">
            <button
                onClick={() => onClick(item.href)}
                className={cn(
                    "group relative flex h-9 w-full items-center overflow-hidden rounded text-left transition-[padding,gap,background-color,color] duration-200 hover:bg-accent active:scale-95",
                    isCollapsed ? "mx-auto w-9 justify-center gap-0 px-0" : "px-3 gap-3",
                    isActive
                        ? "text-primary font-medium hover:text-primary"
                        : "text-muted-foreground hover:text-accent-foreground"
                )}
                title={item.label}
            >
                <span className={cn(
                    "transition-colors shrink-0 flex items-center justify-center",
                    isActive ? "text-primary" : "text-muted-foreground"
                )}>
                    <HugeiconsIcon icon={item.icon} size={14} />
                </span>

                <motion.span
                    initial={false}
                    animate={isCollapsed
                        ? { opacity: 0, x: -6, maxWidth: 0 }
                        : { opacity: 1, x: 0, maxWidth: 160 }
                    }
                    transition={LABEL_TRANSITION}
                    className="min-w-0 overflow-hidden whitespace-nowrap text-[14px] font-normal"
                    aria-hidden={isCollapsed}
                >
                    <span className="block truncate">{item.label}</span>
                </motion.span>
            </button>
        </motion.div>
    );
}
