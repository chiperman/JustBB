"use client"

import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/shared/lib/utils"

interface ContextPageShellProps {
  header: ReactNode
  children: ReactNode
  maxWidthClassName?: string
  contentClassName?: string
  scrollable?: boolean
}

interface ContextPageHeaderProps {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
  title: string
  description?: ReactNode
  breadcrumbLabel?: string
  actions?: ReactNode
  showTitle?: boolean
  className?: string
  contentClassName?: string
}

export function ContextPageShell({
  header,
  children,
  maxWidthClassName = "max-w-screen-md",
  contentClassName,
  scrollable = true,
}: ContextPageShellProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex-none z-30 border-b border-border/20 bg-background/78 backdrop-blur-md">
        <div className={cn("mx-auto w-full", maxWidthClassName)}>
          <div className="px-6 py-5">{header}</div>
        </div>
      </div>

      <div
        data-shortcut-scroll-root={scrollable ? "true" : undefined}
        className={cn(
          "flex-1 min-h-0",
          scrollable ? "overflow-y-auto scrollbar-stable" : "overflow-hidden flex flex-col"
        )}
      >
        <div
          className={cn(
            "mx-auto w-full",
            maxWidthClassName,
            !scrollable && "flex-1 flex flex-col min-h-0"
          )}
        >
          <div
            className={cn(
              scrollable ? "px-6 pt-4 pb-20" : "px-6 pt-4 pb-6 flex-1 flex flex-col min-h-0",
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ContextPageHeader({
  icon,
  title,
  description,
  breadcrumbLabel,
  actions,
  showTitle = false,
  className,
  contentClassName,
}: ContextPageHeaderProps) {
  const crumb = breadcrumbLabel ?? title

  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4 h-10 pl-14 lg:pl-0">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <Link
            href="/"
            className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent"
          >
            <HugeiconsIcon
              icon={Home01Icon}
              size={14}
              className="text-primary/70 transition-colors group-hover:text-primary"
            />
            <span className="font-bold tracking-tight text-primary/90 transition-colors group-hover:text-primary">
              JustMemo
            </span>
          </Link>
          <span className="text-muted-foreground/30 text-[10px] font-light">/</span>
          <div className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon icon={icon} size={14} className="shrink-0 text-primary/60" />
            <span className="truncate text-sm font-medium tracking-tight text-primary">
              {crumb}
            </span>
          </div>
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      {showTitle || description ? (
        <div className={cn("pb-2", contentClassName)}>
          <div className="space-y-2">
            {showTitle ? (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  )
}
