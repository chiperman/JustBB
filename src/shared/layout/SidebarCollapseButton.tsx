"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"
import { useLayout } from "@/state/LayoutContext"

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
  const { animationMultiplier } = useLayout()
  const isLeft = side === "left"
  const showClose = isMobile && isLeft

  // 计算旋转角度：
  // 左边栏展开（!isCollapsed）指向左（0），折叠（isCollapsed）指向右（180）
  // 右边栏展开（!isCollapsed）指向右（180），折叠（isCollapsed）指向左（0）
  const rotateAngle = (isLeft && isCollapsed) || (!isLeft && !isCollapsed) ? 180 : 0

  return (
    <div className="relative z-50">
      <motion.button
        onClick={onClick}
        aria-label={label}
        whileHover={{
          scale: 1.02,
        }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 350 / (animationMultiplier * animationMultiplier),
          damping: 22 / animationMultiplier,
        }}
        className={cn(
          "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-transparent text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
      >
        <motion.div
          animate={{
            rotate: showClose ? 0 : rotateAngle,
          }}
          transition={{
            type: "spring",
            stiffness: 280 / (animationMultiplier * animationMultiplier),
            damping: 22 / animationMultiplier,
          }}
          className="flex items-center justify-center"
        >
          <HugeiconsIcon icon={showClose ? Cancel01Icon : ArrowLeft01Icon} size={15} />
        </motion.div>
      </motion.button>
    </div>
  )
}
