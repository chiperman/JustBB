"use client"

import { ReactNode } from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/shared/lib/utils"

interface BaseFloatingCapsuleProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  className?: string
  /**
   * 垂直锚点位置
   * @default 'bottom'
   */
  position?: "top" | "bottom"
}

/**
 * 通用悬浮胶囊容器
 * 提炼自回收站批量操作栏，保证全站 AI 导视/操作组件风格统一
 */
export function BaseFloatingCapsule({
  children,
  className,
  position = "bottom",
  ...props
}: BaseFloatingCapsuleProps) {
  const isTop = position === "top"

  return (
    <motion.div
      initial={{
        y: isTop ? -100 : 100,
        opacity: 0,
        x: "-50%",
      }}
      animate={{
        y: 0,
        opacity: 1,
        x: "-50%",
      }}
      exit={{
        y: isTop ? -100 : 100,
        opacity: 0,
        x: "-50%",
      }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 200,
      }}
      className={cn(
        "fixed left-1/2 z-50",
        "flex items-center gap-1.5 px-3 py-1.5",
        "rounded-inner border border-border/40 bg-popover backdrop-blur-xl",
        "min-w-[140px] max-w-[90vw]",
        isTop ? "top-8" : "bottom-8",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
