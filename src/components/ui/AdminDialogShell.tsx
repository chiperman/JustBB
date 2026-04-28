"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Cancel01Icon as CloseIcon } from "@hugeicons/core-free-icons"
import { DialogClose } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
}: AdminDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Humanistic Minimalism: 纯白/纯墨背景，极致 1px 边框，无毛玻璃
          "bg-white dark:bg-[#1a1a18] p-0 overflow-hidden rounded-2xl border border-[#1d1d1b]/10 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] [&>button]:hidden transition-all duration-300",
          maxWidth
        )}
      >
        <div className="flex flex-col">
          {/* 页头：低语分割线，Anthropic Clay 强调色 */}
          <DialogHeader className="px-8 py-5 border-b border-[#1d1d1b]/5 dark:border-white/5 flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-[#d97757]/10 p-2.5 rounded-xl text-[#d97757]">
                <HugeiconsIcon icon={Icon} size={22} />
              </div>
              <div>
                <DialogTitle className="text-[18px] font-bold tracking-tight text-[#1d1d1b] dark:text-white/90 antialiased">
                  {title}
                </DialogTitle>
                {subtitle && (
                  <p className="text-[12px] text-[#6b6964] dark:text-[#a39e98] font-medium mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {headerActions}
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-[#1d1d1b] dark:text-white/90 transition-all active:scale-95"
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

          {/* 页脚：Warm Parchment 柔和底色 */}
          {footer && (
            <div className="px-8 py-5 bg-[#f9f7f2]/50 dark:bg-white/[0.02] border-t border-[#1d1d1b]/5 dark:border-white/5 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
