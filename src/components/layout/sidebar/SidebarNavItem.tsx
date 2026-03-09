'use client';

import { motion, Variants } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: { id: string; icon: any; label: string; href: string };
    isActive: boolean;
    isCollapsed: boolean;
    onClick: (href: string) => void;
    labelVariants: Variants;
    navItemVariants: Variants;
}

export function SidebarNavItem({
    item,
    isActive,
    isCollapsed,
    onClick,
    labelVariants,
    navItemVariants
}: SidebarNavItemProps) {
    return (
        <motion.div variants={navItemVariants}>
            <button
                onClick={() => onClick(item.href)}
                className={cn(
                    "flex items-center p-2 h-9 rounded transition-all group relative hover:bg-accent w-full text-left cursor-pointer active:scale-95",
                    isCollapsed ? "justify-center gap-0" : "px-3 gap-3",
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
                    variants={labelVariants}
                    className="text-[14px] font-normal whitespace-nowrap flex items-center"
                >
                    {item.label}
                </motion.span>
            </button>
        </motion.div>
    );
}
