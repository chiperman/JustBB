"use client"

import { cn } from "@/shared/lib/utils"

interface BrandLogoProps {
  className?: string
  pixelSize?: number
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center text-[17px] font-bold leading-none tracking-tight text-foreground",
        className
      )}
      aria-label="JustMemo"
    >
      JustMemo
    </span>
  )
}
