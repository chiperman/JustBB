"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"

interface SidebarCollapseButtonProps {
  isCollapsed: boolean
  onClick: () => void
  side: "left" | "right"
  isMobile?: boolean
  label?: string
  className?: string
}

export function SidebarCollapseButton({
  isCollapsed,
  onClick,
  side,
  isMobile = false,
  label,
  className,
}: SidebarCollapseButtonProps) {
  const getIcon = () => {
    if (isMobile && side === "left") return Cancel01Icon
    if (side === "left") {
      return isCollapsed ? PanelLeftCloseIcon : PanelLeftOpenIcon
    }
    return isCollapsed ? PanelRightOpenIcon : PanelRightCloseIcon
  }

  const Icon = getIcon()

  return (
    <motion.div layout="position" className="relative z-50">
      <button
        onClick={onClick}
        aria-label={label}
        className={cn(
          "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-all duration-200 hover:scale-102 active:scale-95 hover:bg-secondary hover:text-foreground hover:ring-1 hover:ring-border/40 text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
      >
        <HugeiconsIcon icon={Icon} size={14} />
      </button>
    </motion.div>
  )
}
