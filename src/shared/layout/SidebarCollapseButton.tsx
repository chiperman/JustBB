"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

const MotionButton = motion(Button)

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
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      // 回归原生：移除 !transition-none 和 whileHover，使用 Button 组件默认的 CSS 缩放
      className={cn(
        "h-9 w-9 shrink-0 rounded-md px-0 text-muted-foreground hover:bg-secondary hover:text-foreground",
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isCollapsed ? "collapsed" : "expanded"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.15,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="grid place-items-center"
        >
          <HugeiconsIcon icon={Icon} size={16} />
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
