"use client"

import type { ComponentProps } from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/shared/lib/utils"

interface PageEmptyStateProps {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
  title: string
  description: string
  className?: string
}

export function PageEmptyState({ icon, title, description, className }: PageEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[500px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,247,245,0.36))] px-6 py-24 text-center text-muted-foreground",
        className
      )}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 text-primary/55 ring-1 ring-primary/10">
        <HugeiconsIcon icon={icon} size={26} strokeWidth={1.7} />
      </div>
      <p className="text-lg font-semibold text-foreground/55">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground/55">{description}</p>
    </div>
  )
}
