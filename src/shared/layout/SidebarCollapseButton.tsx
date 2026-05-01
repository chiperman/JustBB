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
    <MotionButton
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      // 关键：!transition-none 彻底切断 CSS 引擎干扰，强制由 Framer Motion 独占动画渲染
      // transform-gpu 开启 3D 加速，消除亚像素抖动
      className={cn(
        "h-9 w-9 shrink-0 rounded-md px-0 text-muted-foreground hover:bg-secondary hover:text-foreground !transition-none transform-gpu",
        className
      )}
      style={{ backfaceVisibility: "hidden" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        duration: 0.15,
        ease: [0.25, 0.1, 0.25, 1], // 使用更稳定的贝塞尔曲线
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isCollapsed ? "collapsed" : "expanded"}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.15,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="flex items-center justify-center"
        >
          <HugeiconsIcon icon={Icon} size={16} />
        </motion.span>
      </AnimatePresence>
    </MotionButton>
  )
}
