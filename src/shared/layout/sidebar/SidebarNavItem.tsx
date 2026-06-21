"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/shared/lib/utils"
import { NavigationItem } from "@/config/navigation"
import { useLayout } from "@/state/LayoutContext"

interface SidebarNavItemProps {
  item: NavigationItem
  isActive: boolean
  isCollapsed: boolean
  onClick: (href: string) => void
  onMouseEnter?: (href: string) => void
  onMouseLeave?: () => void
}

export function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: SidebarNavItemProps) {
  const { animationMultiplier } = useLayout()

  const labelTransition = {
    duration: 0.18 * animationMultiplier,
    ease: [0.4, 0, 0.2, 1] as const,
    delay: isCollapsed ? 0 : 0.05 * animationMultiplier,
  }

  return (
    <motion.div layout="position">
      <Link
        href={item.href}
        onClick={(event) => {
          event.preventDefault()
          onClick(item.href)
        }}
        onMouseEnter={() => onMouseEnter?.(item.href)}
        onMouseLeave={onMouseLeave}
        style={{
          transitionDuration: `${200 * animationMultiplier}ms`,
        }}
        className={cn(
          "group relative flex h-9 items-center rounded-md text-left transition-all duration-200 hover:scale-102 active:scale-95",
          isCollapsed ? "w-9" : "w-full",
          isActive
            ? "bg-(--badge-clay-bg) text-primary font-medium"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:ring-1 hover:ring-border/40"
        )}
        title={item.label}
        aria-current={isActive ? "page" : undefined}
      >
        {/* 固定宽高的图标包裹层，提供绝对静止的定位基准 */}
        <div className="shrink-0 flex h-9 w-9 items-center justify-center">
          <span
            className={cn(
              "flex items-center justify-center transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <HugeiconsIcon icon={item.icon} size={14} />
          </span>
        </div>

        <motion.span
          initial={false}
          animate={
            isCollapsed
              ? {
                  opacity: 0,
                  x: -6,
                  maxWidth: 0,
                  marginLeft: 0,
                  transitionEnd: { display: "none" },
                }
              : {
                  opacity: 1,
                  x: 0,
                  maxWidth: 160,
                  marginLeft: 12,
                  display: "block",
                }
          }
          transition={labelTransition}
          className="min-w-0 overflow-hidden whitespace-nowrap nav-button-text tracking-tight"
          aria-hidden={isCollapsed}
        >
          <span className="block truncate">{item.label}</span>
        </motion.span>
      </Link>
    </motion.div>
  )
}
