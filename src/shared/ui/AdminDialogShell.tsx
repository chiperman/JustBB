"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Cancel01Icon as CloseIcon } from "@hugeicons/core-free-icons"
import { DialogClose } from "@/shared/ui/dialog"
import { cn } from "@/shared/lib/utils"
import { motion, type Transition } from "framer-motion"

interface AdminDialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  icon: IconSvgElement
  children: React.ReactNode
  footer?: React.ReactNode
  headerActions?: React.ReactNode
  maxWidth?: string
  contentClassName?: string
  animateLayout?: boolean
  layoutTransition?: Transition
}

export function AdminDialogShell({
  open,
  onOpenChange,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  headerActions,
  maxWidth = "max-w-[640px]",
  contentClassName,
  animateLayout = false,
  layoutTransition,
}: AdminDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn("p-0 overflow-hidden [&>button]:hidden", maxWidth)}
      >
        <motion.div
          layout={animateLayout ? "size" : false}
          transition={layoutTransition}
          className="flex flex-col"
        >
          {/* 页头：低语分割线，Anthropic Clay 强调色 */}
          <DialogHeader className="px-8 py-5 border-b border-border/60 flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-[#d97757]/10 p-2.5 rounded-xl text-[#d97757]">
                <HugeiconsIcon icon={Icon} size={22} />
              </div>
              <div>
                <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground antialiased">
                  {title}
                </DialogTitle>
                {subtitle && (
                  <p className="text-[12px] text-muted-foreground font-medium mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {headerActions}
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-foreground transition-all hover:bg-accent [@media(pointer:coarse)]:active:scale-95"
                >
                  <HugeiconsIcon icon={CloseIcon} size={16} />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          {/* 内容区：支持滚动，隐藏滚动条 */}
          <div
            className={cn(
              "px-8 py-8 overflow-y-auto max-h-[75vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
              contentClassName
            )}
          >
            {children}
          </div>

          {/* 页脚：极致纯净布局 */}
          {footer && <div className="px-8 pb-8 flex items-center shrink-0">{footer}</div>}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
