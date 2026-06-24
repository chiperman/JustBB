"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/shared/lib/utils"
import { NavigationItem } from "@/config/navigation"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"

interface SidebarNavItemProps {
  item: NavigationItem
  isActive: boolean
  isCollapsed: boolean
  onClick: (href: string) => void
  onMouseEnter?: (href: string) => void
  onMouseLeave?: () => void
  isMobile?: boolean
}

export function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isMobile = false,
}: SidebarNavItemProps) {
  const labelTransition = {
    duration: 0.18,
    ease: [0.4, 0, 0.2, 1] as const,
    delay: isCollapsed ? 0 : 0.05,
  }

  const linkElement = (
    <Link
      href={item.href}
      onClick={(event) => {
        event.preventDefault()
        onClick(item.href)
      }}
      onMouseEnter={() => onMouseEnter?.(item.href)}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative flex h-9 items-center rounded-md text-left transition-[background-color,color,box-shadow] duration-200 active:scale-95",
        isMobile && "h-14 rounded-2xl px-4 sm:h-9 sm:rounded-md sm:px-0",
        isCollapsed ? "w-9" : "w-full",
        isActive
          ? "bg-(--badge-clay-bg) text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-[inset_0_0_0_1px_hsl(var(--border)/0.4)]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {/* 固定宽高的图标包裹层，提供绝对静止的定位基准 */}
      <div
        className={cn(
          "shrink-0 flex h-9 w-9 items-center justify-center",
          isMobile && "h-12 w-12 sm:h-9 sm:w-9"
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center transition-colors",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <HugeiconsIcon icon={item.icon} size={isMobile ? 18 : 14} />
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
        className={cn(
          "min-w-0 overflow-hidden whitespace-nowrap nav-button-text tracking-tight",
          isMobile && "text-lg sm:text-inherit"
        )}
        aria-hidden={isCollapsed}
      >
        <span className="block truncate">{item.label}</span>
      </motion.span>
    </Link>
  )

  return (
    <div>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      ) : (
        linkElement
      )}
    </div>
  )
}
