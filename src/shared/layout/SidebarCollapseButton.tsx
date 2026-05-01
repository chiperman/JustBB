"use client"

import * as React from "react"
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
      // 彻底复用 Button 组件自带的 hover:scale-102 和 transition-all
      // 仅添加 hover:ring-1 来对齐菜单按钮的视觉规范
      className={cn(
        "rounded-md hover:ring-1 hover:ring-border/40 focus-visible:ring-0",
        className
      )}
    >
      <HugeiconsIcon icon={Icon} size={16} />
    </Button>
  )
}
