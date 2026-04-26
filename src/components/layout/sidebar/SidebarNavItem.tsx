'use client';

import Link from 'next/link';
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
            <Link
                href={item.href}
                onClick={(event) => {
                    event.preventDefault();
                    onClick(item.href);
                }}
                className={cn(
                    "group relative flex h-9 w-full cursor-pointer items-center overflow-hidden rounded-md text-left transition-[padding,gap,background-color,color] duration-200 active:scale-95",
                    isCollapsed ? "mx-auto w-9 justify-center gap-0 px-0" : "px-3 gap-3",
                    isActive
                        ? "bg-primary/8 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
            >
                <span className={cn(
                    "shrink-0 flex items-center justify-center transition-colors",
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
            </Link>
        </motion.div>
    );
}
